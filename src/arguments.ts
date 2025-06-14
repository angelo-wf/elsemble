import { ParserError } from "./lineparser.js";
import { Architecture, parseArchitecture } from "./opcodes.js";

export class ArgumentError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

export type Arguments = {
  inputFile: string,
  outputFile: string,
  listingFile?: string,
  symbolFile?: string,
  verbose?: boolean,
  passLimit?: number,
  arch?: Architecture,
  expandedList?: boolean,
  help?: boolean
};

enum Option {
  SYMBOLS = "symbols",
  LISTING = "listing",
  VERBOSE = "verbose",
  PASSLIMIT = "passlimit",
  ARCH = "arch",
  EXPANDLISTING = "expandlisting",
  HELP = "help"
}

enum OptionType {
  FLAG,
  STRING,
  NUMBER,
  ARCH
}

type OptionInfo<K> = {
  opt: K,
  value: keyof Arguments,
  optionType: OptionType,
  help: string
}

const longOptions: {[key in Option]: OptionInfo<key>} = {
  [Option.SYMBOLS]: {opt: Option.SYMBOLS, value: "symbolFile", optionType: OptionType.STRING, help: "Create synbol file"},
  [Option.LISTING]: {opt: Option.LISTING, value: "listingFile", optionType: OptionType.STRING, help: "Create listing file"},
  [Option.VERBOSE]: {opt: Option.VERBOSE, value: "verbose", optionType: OptionType.FLAG, help: "Verbose mode"},
  [Option.PASSLIMIT]: {opt: Option.PASSLIMIT, value: "passLimit", optionType: OptionType.NUMBER, help: "Set pass limit"},
  [Option.ARCH]: {opt: Option.ARCH, value: "arch", optionType: OptionType.ARCH, help: "Set architecture"},
  [Option.EXPANDLISTING]: {opt: Option.EXPANDLISTING, value: "expandedList", optionType: OptionType.FLAG, help: "Create expanded listing"},
  [Option.HELP]: {opt: Option.HELP, value: "help", optionType: OptionType.FLAG, help: "Print this help text"}
};

const shortOptions: {[p: string]: Option} = {
  "s": Option.SYMBOLS,
  "l": Option.LISTING,
  "v": Option.VERBOSE,
  "p": Option.PASSLIMIT,
  "a": Option.ARCH,
  "e": Option.EXPANDLISTING,
  "h": Option.HELP
};

const positionalOptions: OptionInfo<number>[] = [
  {opt: 0, value: "inputFile", optionType: OptionType.STRING, help: ""},
  {opt: 1, value: "outputFile", optionType: OptionType.STRING, help: ""}
];

// parse cli arguments in Arguments object
export function parseArguments(args: string[]): Arguments {
  if(args.length === 0) throw new ArgumentError("No arguments provided, use -h for help");
  // go over given arguments
  let pos = 0;
  let positional = 0;
  let parsed: Arguments = {inputFile: "", outputFile: ""};
  while(pos < args.length) {
    let arg = args[pos++]!;
    if(arg.startsWith("--")) {
      // check long option
      let optInfo = (longOptions as {[p: string]: OptionInfo<Option>})[arg.slice(2)];
      if(optInfo) {
        if(handleOption(parsed, optInfo, args[pos])) pos++;
      } else {
        throw new ArgumentError(`Unknown option '${arg}'`);
      }
    } else if(arg.startsWith("-")) {
      // iterate over short options
      let argChars = [...arg];
      for(let i = 1; i < argChars.length; i++) {
        let shortOption = shortOptions[argChars[i]!];
        if(shortOption) {
          let optInfo = longOptions[shortOption];
          if(optInfo.optionType !== OptionType.FLAG && i !== argChars.length - 1) {
            throw new ArgumentError(`Option -${argChars[i]!} needs argument`);
          }
          if(handleOption(parsed, optInfo, args[pos])) pos++;
        } else {
          throw new ArgumentError(`Unknown option '-${argChars[i]!}'`);
        }
      }
    } else {
      if(positional >= positionalOptions.length) throw new ArgumentError("Too many arguments");
      handleOption(parsed, positionalOptions[positional]!, arg);
      positional++;
    }
  }
  if(positional !== positionalOptions.length) {
    throw new ArgumentError("Not enough arguments");
  }
  return parsed;
}

function handleOption(parsed: Arguments, optInfo: OptionInfo<Option | number>, arg?: string): boolean {
  if(optInfo.optionType === OptionType.FLAG) {
    (parsed[optInfo.value] as boolean) = true;
    return false;
  }
  if(arg === undefined) throw new ArgumentError(`No argument for option --${optInfo.opt}`);
  switch(optInfo.optionType) {
    case OptionType.NUMBER: (parsed[optInfo.value] as number) = parseInt(arg); break;
    case OptionType.STRING: (parsed[optInfo.value] as string) = arg; break;
    case OptionType.ARCH: (parsed[optInfo.value] as Architecture) = parseArch(arg); break;
    default: throw optInfo.optionType satisfies never;
  }
  return true;
}

function parseArch(arch: string): Architecture {
  try {
    return parseArchitecture(arch);
  } catch(e) {
    if(e instanceof ParserError) {
      throw new ArgumentError(e.message);
    }
    throw e;
  }
}

// get help text
export function getHelp(): string {
  let optString = Object.entries(shortOptions).map(e => {
    let optInfo = longOptions[e[1]];
    return `-${e[0]}, --${optInfo.opt}${optInfo.optionType !== OptionType.FLAG ? " <arg>" : ""}: ${optInfo.help}`;
  }).join("\n");
  return "Usage: elsemble [options] <infile> <outfile>\nOptions:\n" + optString;
}
