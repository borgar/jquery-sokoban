# Sōkoban

An implementation of Sokōban in JavaScript, as a [jQuery] plugin. It parses and runs the de-facto standardized Sokoban puzzle notation, is capable of running multiple games and includes a separate undo buffer for each one. It's about 300 lines of code.

## How to use

1. Include a reference to the plugin (and jQuery) to the `<head>` section of your document:
```html
        <script src="jquery.min.js"></script>
        <script src="jquery.sokoban.js"></script>
```

2. Add a Sokoban puzzle to your HTML document:
```html
        <pre class="sokoban">
        ####
        # .#
        #  ###
        #*@  #
        #  $ #
        #  ###
        ####
        </pre>
```
3. Run the game when the document loads:
```html
        <script>
        jQuery(function($){
          $('pre.sokoban').sokoban();
        });
        </script>
```



  [jQuery]: http://query.com/

4. Consider adding CSS styles to make the levels look nicer (some are included in the project).
