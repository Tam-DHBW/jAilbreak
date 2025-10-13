import { Given, When, Then, BeforeAll } from "cucumber"

import { Builder, By, Capabilities, Key, WebElementCondition } from "selenium-webdriver";

const capabilities = Capabilities.firefox();
const driver = new Builder().withCapabilities(capabilities).build();

BeforeAll(async function () {
    await driver.get("about:config")
})

Given("I am on google", async function () {
    await driver.get("https://google.com/")
})

Then("The search bar exists", async function () {
    await driver.findElement(By.css('form[action="/search"] textarea'))
})
