import { AfterAll, BeforeAll, setWorldConstructor } from "@cucumber/cucumber"
import puppeteer from "puppeteer"
import { promisify } from "util"
import { exec } from "child_process"
const execPromise = promisify(exec)

let browser
let page

class CustomWorld {
  constructor() {
    this.page = page
    this.browser = browser
  }
}

setWorldConstructor(CustomWorld)

BeforeAll(async () => {
  browser = await puppeteer.launch({
    headless: false
  })
  
  page = await browser.newPage()
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem("jailbreak_username", "BddTestUser")
  })
  await page.goto("https://d1ec4fqqusaq2g.cloudfront.net")
})

AfterAll(async () => {
  await browser.close()
})