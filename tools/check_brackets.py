with open('scratch_test_script_1.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Check balance of braces
brace_count = 0
bracket_count = 0
paren_count = 0

lines = code.split('\n')
for i, line in enumerate(lines, 1):
    # ignore strings
    in_str = False
    str_char = None
    for j, ch in enumerate(line):
        if not in_str and ch in ['"', "'", '`']:
            in_str = True
            str_char = ch
        elif in_str and ch == str_char and line[j-1] != '\\':
            in_str = False
        elif not in_str:
            if ch == '{': brace_count += 1
            elif ch == '}':
                brace_count -= 1
                if brace_count < 0:
                    print(f"Negative brace count at line {i}: {line[:60]}")
            elif ch == '(': paren_count += 1
            elif ch == ')': paren_count -= 1
            elif ch == '[': bracket_count += 1
            elif ch == ']': bracket_count -= 1

print(f"End counts -> brace: {brace_count}, paren: {paren_count}, bracket: {bracket_count}")
