import { AfterAll, Given, Then, When } from "@cucumber/cucumber"
import puppeteer from "puppeteer-core"
import assert from "assert"
import { promisify } from "util"
import { exec } from "child_process"
const execPromise = promisify(exec)

const browser = await puppeteer.launch({
  browser: "firefox",
  executablePath: (await execPromise("which firefox")).stdout.trim(),
  headless: false
})

const page = await browser.newPage()
await page.evaluateOnNewDocument(() => {
  localStorage.setItem("jailbreak_username", "BddTestUser")
  localStorage.setItem("jailbreak-tutorial-seen", true)
  localStorage.setItem("jailbreak-unlocked-levels", JSON.stringify(["26", "1", "47", "46"]))
})
await page.goto("https://d1ec4fqqusaq2g.cloudfront.net")

const SELECTORS = {
  messageInput: "input[placeholder='ENTER JAILBREAK COMMAND...']",
  messageFromAi: ".chat-messages .message-ai",
  levelTwo: ".password-card form~div button~button",
  userMessages: "message message-user",
  gatekeeperMessage: ".gatekeeper-message",
}


Given("I am on the game page", async () => {
  await page.goto("/game")
})

Then("The chat box exists", async () => {
  assert.notEqual(await page.$(SELECTORS.messageInput), null)
})

Given("I send a message to the gatekeeper", async () => {
  await page.type(SELECTORS.messageInput, "Hello gatekeeper, how are you doing?\n")
})

Then("There is a response from the gatekeeper", async () => {
  await page.waitForSelector(SELECTORS.messageFromAi)
})

When("I click on a level", async () => {
  await page.locator(SELECTORS.levelTwo).click()
})

Then("The chat history should be cleared", async () => {
  let messages = await page.$$(SELECTORS.userMessages)
  assert.equal(messages.length, 0)
})

Then("The current level info should be updated", async () => {
  let levelName = (await (await (await page.$(SELECTORS.levelTwo)).getProperty("title")).jsonValue()).split(" -")[0]
  let gatekeeperMessage = await (await (await page.$(SELECTORS.gatekeeperMessage)).getProperty("textContent")).jsonValue()
  assert.ok(gatekeeperMessage.toLowerCase().includes(levelName.toLowerCase()))
})

AfterAll(async () => {
  await browser.close()
})
