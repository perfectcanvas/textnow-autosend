/**
 * Log into TextNow and get cookies
 * @param {object} page Puppeteer browser page
 * @param {object} client Puppeteer CDPSession
 * @param {string} username Optional account credential
 * @param {string} password Optional account credential
 * @return {object} Updated login cookies
 */
module.exports.logIn = async (
    page, client, username = undefined, password = undefined) => {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36')
  await Promise.all([
    page.goto('https://www.textnow.com/login'),
    page.setDefaultNavigationTimeout(0),
    page.waitForNavigation({waitUtil: 'networkidle2'}),
  ]);

  // Resolve captcha if found.
  if (await page.$('div.cf-captcha-container') !== null) {
    console.log('hCaptcha was found, try to solve.');

    await page.waitForSelector('iframe[title~="hCaptcha"]');

    await Promise.all([
      page.solveRecaptchas(),
      page.waitForNavigation(),
      page.waitForTimeout(500),
    ]);
  }

  await page.waitForTimeout(500);
    
  if (username && password) {
    try{
    await page.waitForSelector('#txt-username');
    }catch{
        console.log(await page.content());
    }
    await page.type('#txt-username', username);
    await page.type('#txt-password', password);

    const logInButton = await page.waitForSelector('#btn-login');
    await Promise.all([logInButton.click(), page.waitForNavigation()]);

    return (await client.send('Network.getAllCookies')).cookies;
  }

  const isLoggedIn = page.url().includes('/messaging');
  if (!isLoggedIn) {
    throw new Error('Detected invalid or expires cookies');
  }

  return (await client.send('Network.getAllCookies')).cookies;
};

/**
 * Select a conversation using recipient info
 * @param {object} page Puppeteer browser page
 * @param {string} recipient Recipient info
 */
module.exports.selectConversation = async (page, recipient) => {
  await Promise.all([
    page.goto('https://www.textnow.com/messaging'),
    page.waitForNavigation({waitUtil: 'networkidle2'}),
  ]);

  await page.waitForTimeout(5000);

  await page.$eval('#newText', (element) => element.click());
  await page.waitForTimeout(500);

  const recipientField = await page.waitForSelector(
      '.newConversationTextField',
  );
  await page.waitForTimeout(500);
  await recipientField.type(recipient);
  await page.waitForTimeout(500);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(3000);
};

/**
 * Send a message to the current recipient
 * @param {object} page Puppeteer browser page
 * @param {string } message Message content
 */
module.exports.sendMessage = async (page, message) => {
  const messageField = await page.waitForSelector('#text-input');
  await page.waitForTimeout(500);
  await messageField.type(message);
  await page.waitForTimeout(500);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(5000);
};

/**
 * Encipher string and return the result
 * @param {string} str crypto string
 */
module.exports.md5 = (str) => {
  const crypto = require('crypto');
  const md5 = crypto.createHash('md5');
  md5.update(str, 'utf8');

  return md5.digest('hex').toUpperCase();
};
