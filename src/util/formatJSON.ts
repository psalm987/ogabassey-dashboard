const formatJSON = (input: string): string[] => {
  let resultList: string[] = [];
  let result = "";
  const bracket_stack: string[] = [];
  const bracket_matcher: Record<string, string> = {
    "{": "}",
    "[": "]",
    "(": ")",
  };
  const open_brackets = Object.keys(bracket_matcher);
  const close_brackets = Object.values(bracket_matcher);
  for (let i = 0; i < input.length; i++) {
    const letter = input.at(i)!;
    if (open_brackets.includes(letter)) {
      bracket_stack.push(letter);
    } else if (
      close_brackets.includes(letter) &&
      bracket_stack.length &&
      letter === bracket_matcher[bracket_stack.at(-1)!]
    ) {
      bracket_stack.pop();
      if (!bracket_stack.length) {
        result += letter;
        resultList.push(result.trim());
        result = "";
        continue;
      }
    }
    result += letter;
  }
  return resultList;
};

export default formatJSON;
