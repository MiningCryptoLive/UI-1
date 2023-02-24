/* tslint:disable:no-var-requires no-string-literal */

import Cookies from "js-cookie";
import Clipboard from "clipboard";
import toastr from "toastr";

require("script-loader!clipboard/dist/clipboard.min.js");
require("featherlight/release/featherlight.min.js");
require("script-loader!toastr/build/toastr.min.js");
require("cookieconsent/build/cookieconsent.min.js");

////////////////////////////////////////
// Popup window centered

function popupCenter(url: string, title: string, w: number, h: number) {
  // Fixes dual-screen position
  const dualScreenLeft =
    window.screenLeft !== undefined
      ? window.screenLeft
      : (screen as any)["left"];
  const dualScreenTop =
    window.screenTop !== undefined ? window.screenTop : (screen as any)["top"];

  const width = window.innerWidth
    ? window.innerWidth
    : document.documentElement.clientWidth
    ? document.documentElement.clientWidth
    : screen.width;
  const height = window.innerHeight
    ? window.innerHeight
    : document.documentElement.clientHeight
    ? document.documentElement.clientHeight
    : screen.height;

  const left = width / 2 - w / 2 + dualScreenLeft;
  const top = height / 2 - h / 2 + dualScreenTop;
  const newWindow = window.open(
    url,
    title,
    "scrollbars=yes, width=" +
      w +
      ", height=" +
      h +
      ", top=" +
      top +
      ", left=" +
      left
  );

  // Puts focus on the newWindow
  if (window.focus) {
    newWindow.focus();
  }
}

////////////////////////////////////////
// Sticky navbar handler

const bgClass = "nav-bg-plasma";

$(document).ready(function () {
  const el = $("nav.fixed-top");

  if (el.length === 0) {
    return;
  }

  if ($(window).scrollTop() > 55) {
    $(".navbar").addClass(bgClass);
  } else {
    $(".navbar").removeClass(bgClass);
  }

  $(window).scroll(function () {
    if ($(window).scrollTop() > 55) {
      $(".navbar").addClass(bgClass);
    } else {
      $(".navbar").removeClass(bgClass);
    }
  });

  // If Mobile, add background color when toggler is clicked
  $(".navbar-toggler").click(function () {
    if (!$(".navbar-collapse").hasClass("show")) {
      $(".navbar").addClass(bgClass);
    } else {
      if ($(window).scrollTop() < 55) {
        $(".navbar").removeClass(bgClass);
      } else {
      }
    }
  });
});

////////////////////////////////////////
// Theme toggle

const btnThemeToggle = document.querySelector("#theme-toggler");
const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");

function setThemeCookie(theme: string) {
  Cookies.set("theme", theme, { expires: 365 * 10 });
}

function applyTheme(theme: string) {
  if (theme == "light") {
    document.body.classList.remove("dark-mode");
    document.body.classList.add("light-mode");
  } else {
    document.body.classList.remove("light-mode");
    document.body.classList.add("dark-mode");
  }
}

function onToggleThemeClick(e: any) {
  let theme = Cookies.get("theme");

  if (theme == null) {
    theme = prefersDarkScheme.matches ? "dark" : "light";
  }

  if (theme == "light") {
    theme = "dark";
  } else {
    theme = "light";
  }

  setThemeCookie(theme);

  e.preventDefault();

  window.location.reload();

  return false;
}

if(btnThemeToggle != null) {
  btnThemeToggle.addEventListener("click", onToggleThemeClick);
}

let startTheme = Cookies.get("theme");

if (startTheme == null) {
  startTheme = prefersDarkScheme.matches ? "dark" : "light";

  setThemeCookie(startTheme);
}

applyTheme(startTheme);

(window as any).onToggleThemeClick = onToggleThemeClick;

////////////////////////////////////////
// Clipboard helpers

const selfClickCopySelector: string = '.self-click-copy';

document.querySelectorAll(selfClickCopySelector).forEach(el=> {
  el.setAttribute("title", "Left-click to copy")
})

new Clipboard(selfClickCopySelector, {
  target: trigger=> trigger // the trigger itself is the target
}).on('success', e=> {
  toastr.success("Copied to clipboard", null,{ timeOut: 2000 });
});

////////////////////////////////////////
// Misc

function share(e: Event) {
  e.preventDefault();
  popupCenter((e.currentTarget as HTMLAnchorElement).href, "Share", 1024, 768);
}

$(".nav-link.social").click(share as any);
$(".social-buttons.hidden-xs-down .social-button").click(share as any);
$(".social-inline").click(share as any);
$(".share-link").click(share as any);

$('[data-toggle="tooltip"]').tooltip();

////////////////////////////////////////
// Cookie Consent

(window as any)["cookieconsent"].initialise({
  container: document.body,
  palette: {
    popup: { background: "#237afc" },
    button: { background: "transparent", border: "#fff", text: "#fff" },
  },
  revokable: false,
  law: {
    regionalLaw: false,
  },
  location: false,
});
