import { Then } from "@cucumber/cucumber"
import assert from "assert"

Then("I should see the page content", async function() {
  // Just check if page loaded by looking for any content
  const hasContent = await this.page.evaluate(() => {
    return document.body.textContent.length > 0
  })
  assert(hasContent, "Page should have content")
})