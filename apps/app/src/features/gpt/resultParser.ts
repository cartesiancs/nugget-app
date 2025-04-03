export function parseCommands(input) {
  const prefixes = ["ADD", "EDT", "RMV"];
  const types = ["IMAGE", "VIDEO", "TEXT"];
  input = input.trim();
  const result: any = [];
  let currentCommand = "";
  let inQuote = false;

  function isCommandStartAt(index) {
    for (const prefix of prefixes) {
      if (input.substring(index, index + prefix.length) === prefix) {
        let pos = index + prefix.length;
        if (pos < input.length && input[pos] === " ") {
          while (pos < input.length && input[pos] === " ") pos++;
          let token = "";
          while (pos < input.length && input[pos] !== " ") {
            token += input[pos];
            pos++;
          }
          if (types.includes(token)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  let i = 0;
  while (i < input.length) {
    const char = input[i];
    if (char === '"') {
      inQuote = !inQuote;
      currentCommand += char;
      i++;
      continue;
    }
    if (!inQuote && i > 0 && input[i - 1] === " " && isCommandStartAt(i)) {
      if (currentCommand.trim().length > 0) {
        result.push(currentCommand.trim());
      }
      currentCommand = "";
    }
    currentCommand += char;
    i++;
  }
  if (currentCommand.trim().length > 0) {
    result.push(currentCommand.trim());
  }
  return result;
}

function tokenizeCommand(str) {
  const tokens: any = [];
  let currentToken = "";
  let inQuote = false;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '"') {
      inQuote = !inQuote;
      currentToken += char;
    } else if (char === " " && !inQuote) {
      if (currentToken.length > 0) {
        tokens.push(currentToken);
        currentToken = "";
      }
    } else {
      currentToken += char;
    }
  }
  if (currentToken.length > 0) tokens.push(currentToken);
  return tokens;
}

function parseOptions(optionStr): any {
  const options = {};
  const parts = optionStr.split(":");
  for (let part of parts) {
    const [key, value] = part.split("=");
    options[key] = value;
  }
  return options;
}

export function actionParsor(parsered) {
  const control = document.querySelector("element-control");
  parsered.forEach((commandStr) => {
    const tokens = tokenizeCommand(commandStr);
    const action = tokens[0];
    const type = tokens[1];
    const options = parseOptions(tokens[tokens.length - 1]);
    switch (`${action} ${type}`) {
      case "ADD TEXT": {
        let textToken = tokens.slice(2, tokens.length - 1).join(" ");
        textToken = textToken.replace(/^"(.*)"$/, "$1");
        control.addText({
          text: textToken,
          locationX: parseInt(options.x),
          locationY: parseInt(options.y),
          startTime: parseInt(options.t) * 1000,
          duration: parseInt(options.d) * 1000,
        });
        console.log(textToken, "TEXT");
        break;
      }
      // case "ADD VIDEO": {
      //   let videoToken = tokens.slice(2, tokens.length - 1).join(" ");
      //   videoToken = videoToken.replace(/^"(.*)"$/, "$1");
      //   control.addVideo({
      //     video: videoToken,
      //     locationX: parseInt(options.x),
      //     locationY: parseInt(options.y),
      //     width: parseInt(options.w),
      //     height: parseInt(options.h),
      //     startTime: parseInt(options.t) * 1000,
      //     duration: parseInt(options.d) * 1000,
      //   });
      //   console.log(videoToken, "VIDEO");
      //   break;
      // }
      // case "ADD IMAGE": {
      //   let imageToken = tokens.slice(2, tokens.length - 1).join(" ");
      //   imageToken = imageToken.replace(/^"(.*)"$/, "$1");
      //   control.addImage({
      //     image: imageToken,
      //     locationX: parseInt(options.x),
      //     locationY: parseInt(options.y),
      //     width: parseInt(options.w),
      //     height: parseInt(options.h),
      //     startTime: parseInt(options.t) * 1000,
      //     duration: parseInt(options.d) * 1000,
      //   });
      //   console.log(imageToken, "IMAGE");
      //   break;
      // }
      default:
        console.log("Unsupported command:", commandStr);
        break;
    }
  });
}
