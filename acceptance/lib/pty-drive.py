# 用伪终端驱动交互式 CLI（prompts 风格：「? 问题 ›」），供 acceptance 运行器调用。
# 输入：argv[1] 为 JSON 规格；输出：stdout 最后一行 JSON 结果，完整去色记录写到 spec.transcript。
#
# 规格字段：
#   argv        要运行的命令
#   cwd         工作目录
#   timeoutSec  总超时
#   mode        "enumerate"：枚举 enumeratePrompt 的全部选项后结束
#               "answer"：按 selects 选择选项，其余问题取默认值，必填文本填 fallbackAnswer，直到进程退出
#   enumeratePrompt  枚举模式下要枚举的问题（正则）
#   preSelects  枚举模式下，到达 enumeratePrompt 之前要先选择的 {问题正则: 选项全文}
#   selects     {问题正则: 选项全文}
#   fallbackAnswer   无默认值的文本问题填写的值
import json
import os
import pty
import re
import select
import signal
import sys
import time

ANSI = re.compile(r"\x1b\[[0-9;?]*[A-Za-z]|\x1b[78]|\r")
PROMPT = re.compile(r"\?\s+(.+?)\s+›")
HIGHLIGHT = re.compile(r"❯\s+(.+?)\s*$", re.M)
DOWN = b"\x1b[B"
ENTER = b"\r"

spec = json.loads(sys.argv[1])
deadline = time.time() + spec.get("timeoutSec", 300)

pid, fd = pty.fork()
if pid == 0:
    os.chdir(spec.get("cwd") or ".")
    os.execvp(spec["argv"][0], spec["argv"])

raw = b""
exited = False
exit_code = None


def text():
    return ANSI.sub("", raw.decode("utf8", "replace"))


def pump(seconds):
    """读取输出，进程结束返回 False"""
    global raw, exited
    end = time.time() + seconds
    while time.time() < end:
        ready, _, _ = select.select([fd], [], [], 0.1)
        if ready:
            try:
                chunk = os.read(fd, 65536)
            except OSError:
                exited = True
                return False
            if not chunk:
                exited = True
                return False
            raw += chunk
    return True


def send(data):
    os.write(fd, data)


def highlighted():
    """当前高亮项：全文最后一处「❯ 选项」"""
    found = HIGHLIGHT.findall(text())
    return found[-1] if found else None


def move_down(previous):
    """按下键并等高亮项变化；局部重绘可能稍晚到达，最多等 2 秒"""
    send(DOWN)
    end = time.time() + 2
    while time.time() < end:
        pump(0.2)
        current = highlighted()
        if current != previous:
            return current
    return highlighted()


def wait_prompt(since):
    """等到 since 之后出现新问题，返回 (问题, 问题之后的位置)"""
    while time.time() < deadline:
        match = PROMPT.search(text(), since)
        if match:
            pump(0.6)
            return match.group(1), match.end()
        if not pump(0.3):
            return None, since
    return None, since


def choose(label):
    """在选择题里按下键直到高亮项为 label 后回车；转完一圈或到底仍找不到返回 False"""
    seen = []
    current = highlighted()
    for _ in range(80):
        if current == label:
            send(ENTER)
            return True
        if current in seen:
            return False
        seen.append(current)
        current = move_down(current)
    return False


def enumerate_choices():
    """逐个下移读取高亮项，回到已见过的项（循环或到底不动）即结束"""
    items = []
    current = highlighted()
    for _ in range(80):
        if current is None or current in items:
            break
        items.append(current)
        current = move_down(current)
    return items


def answered_cursor(question):
    """回答后的读取位置：落在该问题最后一次渲染之后，后续的新问题即使已在缓冲里也不会被跳过"""
    current = text()
    # 带上「 ›」，避免「请选择模板」误匹配「请选择模板分支」
    last = max(
        current.rfind("? " + question + " ›"), current.rfind("✔ " + question + " ›")
    )
    return last + 1 if last >= 0 else len(current)


result = {"items": None, "unmatched": None}
cursor = 0
try:
    if spec["mode"] == "enumerate":
        pattern = re.compile(spec["enumeratePrompt"])
        pre = {re.compile(k): v for k, v in (spec.get("preSelects") or {}).items()}
        while time.time() < deadline:
            question, after = wait_prompt(cursor)
            if question is None:
                break
            if pattern.search(question):
                result["items"] = enumerate_choices()
                break
            target = next((v for k, v in pre.items() if k.search(question)), None)
            if target is not None and not choose(target):
                result["unmatched"] = {"question": question, "label": target}
                break
            if target is None:
                send(ENTER)
            pump(0.5)
            cursor = answered_cursor(question)
    else:
        selects = {re.compile(k): v for k, v in (spec.get("selects") or {}).items()}
        while time.time() < deadline and not exited:
            question, after = wait_prompt(cursor)
            if question is None:
                break
            rest = text()[after:]
            target = next((v for k, v in selects.items() if k.search(question)), None)
            if target is not None:
                if not choose(target):
                    result["unmatched"] = {"question": question, "label": target}
                    break
            elif "Use arrow-keys" in rest or "❯" in rest:
                send(ENTER)
            elif re.search(r"\((?:y/N|Y/n)\)", rest):
                send(ENTER)
            else:
                line = rest.split("\n", 1)[0].strip()
                if line == "":
                    send(spec.get("fallbackAnswer", "acceptance").encode() + ENTER)
                else:
                    send(ENTER)
            pump(0.5)
            cursor = answered_cursor(question)
        while not exited and time.time() < deadline:
            pump(0.5)
finally:
    timed_out = time.time() >= deadline and not exited
    if not exited:
        try:
            os.kill(pid, signal.SIGKILL)
        except OSError:
            pass
    try:
        _, status = os.waitpid(pid, 0)
        if os.WIFEXITED(status):
            exit_code = os.WEXITSTATUS(status)
    except ChildProcessError:
        pass
    if spec.get("transcript"):
        with open(spec["transcript"], "w") as handle:
            handle.write(text())
    result.update({"exitCode": exit_code, "timedOut": timed_out})
    print(json.dumps(result, ensure_ascii=False))
