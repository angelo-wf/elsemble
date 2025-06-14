import { ArgumentError, Arguments, getHelp, parseArguments } from "./arguments.js";
import { Assembler } from "./assembler.js";

// parse arguments
let args: Arguments;
try {
  args = parseArguments(process.argv.slice(2));
} catch(e) {
  if(e instanceof ArgumentError) {
    console.error(e.message);
    process.exit(1);
  } else {
    throw e;
  }
}
if(args.help) console.log(getHelp());
// assemble
let assembler = new Assembler(args);
if(!assembler.assemble()) {
  process.exit(1);
}
process.exit(0);
