Armoire is a javascript library that helps switching between alternate CSS stylesheets.

## Basic Usage

First, give an `id` to your alternate stylesheets.

    <link id="light-style" rel="stylesheet" title="Light" href="light.css">
    <link id="dark-style" rel="alternate stylesheet" title="Dark" href="dark.css">
    <script src="armoire.js"></script>

Then in a link use the `set-style` class with the `href` attribute referencing the style to enable.

    <a href="#light-style">Let there be light</a>
    <a href="#dark-style">or darkness</a>

### Non-standard Alternate Stylesheets

You can use Armoire with stylesheets that are do now follow the alternate stylesheets scheme.

The first class of the stylesheet defines what *style group* that stylesheet is part of. When one stylesheet from a style group is enabled, all other stylesheets from that group are disabled.

To define the default stylesheet of a group use the `default-style` class.

    <link id="light-style" class="luminosity-styles default-style" rel="stylesheet" src="light.css">
    <link id="dark-style" class="luminosity-styles" rel="stylesheet" src="dark.css">
    <script src="armoire.js"></script>

Armoire will automatically check for stylesheets with the `default-style` on initialization, but it doesn't watch for stylesheets added after it was loaded. It's a good idea to include armoire.js after your stylesheets have been defined but before the body of the page so it can setup your page style before anything is shown.

