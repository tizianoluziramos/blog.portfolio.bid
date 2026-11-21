const cheerio = require("cheerio");

hexo.extend.filter.register("after_render:html", function (html) {
  const $ = cheerio.load(html, null, false);

  const credits = [
    {
      selector: 'footer a[href*="hexo.io"]',
      label: /powered\s+by/i,
    },
    {
      selector: 'footer a[href*="hexo-theme-redefine"]',
      label: /\btheme\b/i,
    },
  ];

  for (const { selector, label } of credits) {
    $(selector).each(function () {
      const link = $(this);

      let element = link.parent();

      while (element.length && !element.is("footer")) {
        const text = element.text().replace(/\s+/g, " ").trim();

        if (label.test(text) && text.length < 120) {
          element.remove();
          break;
        }

        element = element.parent();
      }
    });
  }

  return $.html();
});