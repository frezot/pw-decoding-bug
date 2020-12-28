const http = require("http");
const playwright = require("playwright");

beforeEach(async () => {
  const server = http
    .createServer((_, res) => {
      const buffer = Buffer.from(
        `
        <!DOCTYPE html>
        <html lang="ru-RU">
        
        <head>
            <meta charset="UTF-8">
        </head>
        
        <body>

        <input id="btn" value="Нажми меня" onclick="(async function foo() {

        await fetch('http://example.com', {
          method: 'post',
          body: JSON.stringify({
            'key': 'кириллица abc 13 ⚠️'
          })
        });
        
        })()
        " type="button">
        </body>
        
        </html>
    `,
        "utf8"
      );
      res.write(buffer);
      res.end();
      server.close();
    })
    .listen(4545);
});

test.each([["webkit"], ["chromium"], ["firefox"]])(
  "[%s] Decoding of request.postData",
  async (browserType) => {
    const browser = await playwright[browserType].launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("http://localhost:4545");
    page.on("request", async (request) => {
      expect(request.postData()).toBe(`{"key":"кириллица abc 13 ⚠️"}`);
    });

    await page.click("#btn");

    await browser.close();
  }
);
