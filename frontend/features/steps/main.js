import { Given, When, Then, BeforeAll, AfterAll } from "cucumber"

import { Builder, By, Capabilities, until } from "selenium-webdriver";

const capabilities = Capabilities.firefox();
const driver = new Builder().withCapabilities(capabilities).build();

BeforeAll(async () => {
  await driver.get("about:newtab")
})

Given("I am on jAilbreak", async () => {
  await driver.get("https://d1ec4fqqusaq2g.cloudfront.net/")
})

Given("I am logged in", { timeout: -1 }, async () => {
  const locator = By.id("btn-sign-out")
  await driver.wait(until.elementLocated(locator))
})

When("I log out", async () => {
  await driver.actions().click(await driver.findElement(By.id("btn-sign-out"))).perform()
})

Then("I am logged out", { timeout: 2000 }, async () => {
  await driver.wait(until.elementLocated(By.css("input[type=email]")))
})

AfterAll(async () => {
  await driver.close()
})
