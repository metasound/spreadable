import chalk from "chalk";
import yargs from "yargs";
import srcUtils from "../src/utils.js";
import { hideBin } from 'yargs/helpers'



const argv = yargs(hideBin(process.argv)).argv;

/**
 * Show the node status info
 */
export const status = async (node) => {
  const info = await node.getStatusInfo(true);
  //eslint-disable-next-line no-console
  console.log(chalk.cyan(JSON.stringify(info, null, 2)));
};

/**
 * Get all banlist
 */
export const getBanlist = async (node) => {
  const fullInfo = argv.fullInfo || argv.f;
  const list = await node.db.getBanlist();

  if (!list.length) {
    //eslint-disable-next-line no-console
    console.log(chalk.cyan(`The banlist is empty`));
    return;
  }

  for (let i = 0; i < list.length; i++) {
    const result = list[i];
    //eslint-disable-next-line no-console
    console.log(chalk.cyan(fullInfo ? JSON.stringify(result, null, 2) : result.address));
  }
};

/**
 * Get the banlist address info
 */
export const getBanlistAddress = async (node) => {
  const address = argv.address || argv.n;

  if (!address) {
    throw new Error(`Address is required`);
  }

  const result = await node.db.getBanlistAddress(address);

  if (!result) {
    throw new Error(`Address "${address}" not found`);
  }

  //eslint-disable-next-line no-console
  console.log(chalk.cyan(JSON.stringify(result, null, 2)));
};

/**
 * Add the address to the banlist
 */
export const addBanlistAddress = async (node) => {
  const address = argv.address || argv.n;
  const lifetime = srcUtils.getMs(argv.lifetime || argv.t);
  const reason = argv.reason || argv.r;

  if (!srcUtils.isValidAddress(address)) {
    throw new Error(`Address is invalid`);
  }

  if (!lifetime) {
    throw new Error(`Lifetime is required`);
  }

  await node.db.addBanlistAddress(address, +lifetime, reason);
  //eslint-disable-next-line no-console
  console.log(chalk.cyan(`Address "${address}" has been added to the banlist`));
};

/**
 * Remove the address from the banlist
 */
export const removeBanlistAddress = async (node) => {
  const address = argv.address || argv.n;

  if (!address) {
    throw new Error(`Address is required`);
  }

  await node.db.removeBanlistAddress(address);
  //eslint-disable-next-line no-console
  console.log(chalk.cyan(`Address "${address}" has been removed from the banlist`));
};

/**
 * Empty the banlist
 */
export const emptyBanlist = async (node) => {
  await node.db.emptyBanlist();
  //eslint-disable-next-line no-console
  console.log(chalk.cyan(`The banlist has been cleaned`));
};

/**
 * Create a backup
 */
export const backup = async (node) => {
  await node.db.backup();
  //eslint-disable-next-line no-console
  console.log(chalk.cyan(`The backup has been created`));
};

/**
 * Restore the database
 */
export const restore = async (node) => {
  const index = argv.index || argv.i;
  await node.db.restore(index);
  //eslint-disable-next-line no-console
  console.log(chalk.cyan(`The database has been restored`));
};
