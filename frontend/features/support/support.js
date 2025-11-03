import { AfterAll, Given, Then } from "@cucumber/cucumber"
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
})
await page.goto("https://d1ec4fqqusaq2g.cloudfront.net")

const SELECTORS = {
  messageInput: "input[placeholder='ENTER JAILBREAK COMMAND...']",
  messageFromAi: ".chat-messages .message-ai",
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

AfterAll(async () => {
  await browser.close()
})
