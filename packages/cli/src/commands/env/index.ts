import type Client from '../../util/client';
import { parseArguments } from '../../util/get-args';
import getInvalidSubcommand from '../../util/get-invalid-subcommand';
import getSubcommand from '../../util/get-subcommand';
import { printError } from '../../util/error';
import { type Command, help } from '../help';
import add from './add';
import ls from './ls';
import pull from './pull';
import rm from './rm';
  runSubcommand,
  updateSubcommand,
} from './command';
import { getFlagsSpecification } from '../../util/get-flags-specification';
import output from '../../output-manager';
import { EnvTelemetryClient } from '../../util/telemetry/commands/env';
import { getCommandAliases } from '..';

const COMMAND_CONFIG = {
  ls: getCommandAliases(listSubcommand),
  add: getCommandAliases(addSubcommand),
  rm: getCommandAliases(removeSubcommand),
  pull: getCommandAliases(pullSubcommand),
    case 'run':
      /**
       * The run subcommand uses a helper to check for --help because of the
       * special `--` argument separator. The user's command (after `--`) might
       * include --help intended for their program, not for vercel. For example:
       *   `vercel env run --help` → shows vercel's help
       *   `vercel env run -- node --help` → runs node's help
       */
      if (needsHelpForRun(client)) {
        telemetry.trackCliFlagHelp('env', subcommandOriginal);
        printHelp(runSubcommand);
        return 2;
      }
      telemetry.trackCliSubcommandRun(subcommandOriginal);
      return run(client);
    case 'update':
      if (needHelp) {
        telemetry.trackCliFlagHelp('env', subcommandOriginal);
        printHelp(updateSubcommand);
        return 2;
      }
      telemetry.trackCliSubcommandUpdate(subcommandOriginal);
      return update(client, args);
    default:
      output.error(getInvalidSubcommand(COMMAND_CONFIG));
      output.print(help(envCommand, { columns: client.stderr.columns }));
      return 2;
  }
}
