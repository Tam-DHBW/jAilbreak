import { Given, Then, When } from "@cucumber/cucumber"
import assert from "assert"

const SELECTORS = {
  messageInput: "input[placeholder='ENTER JAILBREAK COMMAND...']",
  messageFromAi: ".message-ai",
  levelTwo: ".password-card form~div button~button",
  userMessages: "message message-user",
  gatekeeperMessage: ".gatekeeper-message",
}


Given("I am on the game page", async function() {
  // Start from home page
  await this.page.goto("https://d1ec4fqqusaq2g.cloudfront.net")
  
  // Check if already authenticated (navbar exists)
  const navbar = await this.page.$('.navbar')
  if (!navbar) {
    // Need to authenticate first
    await this.page.waitForSelector('input[placeholder="Your name"]', { timeout: 10000 })
    await this.page.type('input[placeholder="Your name"]', 'TestUser')
    await this.page.click('button[type="submit"]')
    await this.page.waitForSelector('.navbar', { timeout: 15000 })
  }
  
  // Navigate to game page
  await this.page.click('a[href="/game"]')
  
  // Wait for game page to load
  await this.page.waitForSelector('.chat-container', { timeout: 10000 })
  
  // Dismiss tutorial popup if it exists
  const tutorialPopup = await this.page.$('.tutorial-overlay')
  if (tutorialPopup) {
    await this.page.click('.tutorial-close')
  }
})

Then("The chat box exists", async function() {
  assert.notEqual(await this.page.$(SELECTORS.messageInput), null)
})

When("I send a message to the gatekeeper", async function() {
  await this.page.waitForSelector(SELECTORS.messageInput, { timeout: 5000 })
  
  // Clear and type message
  await this.page.click(SELECTORS.messageInput, { clickCount: 3 })
  await this.page.type(SELECTORS.messageInput, "Hello gatekeeper, how are you doing?")
  
  // Click send button
  await this.page.click('.chat-input-form button[type="submit"]')
  
  // Wait for user message to appear in chat
  await this.page.waitForSelector('.message-user', { timeout: 5000 })
})

Then("There is a response from the gatekeeper", async function() {
  await this.page.waitForSelector(SELECTORS.messageFromAi, { timeout: 30000 })
})

When("I click on a level", async function() {
  await this.page.click(SELECTORS.levelTwo)
})

Then("The chat history should be cleared", async function() {
  let messages = await this.page.$$(SELECTORS.userMessages)
  assert.equal(messages.length, 0)
})

Then("The current level info should be updated", async function() {
  const gatekeeperMessage = await this.page.$eval(SELECTORS.gatekeeperMessage, el => el.textContent)
  assert.ok(gatekeeperMessage.length > 0)
})


