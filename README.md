Armoire is a javascript library that helps switching between alternate CSS stylesheets.

## Basic Usage

First, give an `id` to your alternate stylesheets.

    <link id="light-style" rel="stylesheet" title="Light" href="light.css">
    <link id="dark-style" rel="alternate stylesheet" title="Dark" href="dark.css">
    <script src="armoire.css"></script>

Then in a link use the `set-style` class with the `href` attribute referencing the style to enable.

    <a href="#light-style">Let there be light</a>
    <a href="#dark-style">or darkness</a>

That's all.