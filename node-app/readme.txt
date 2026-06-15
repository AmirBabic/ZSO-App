The APP is a node based web app using express (https://expressjs.com/) with 
handlebars (https://github.com/ericf/express-handlebars) for templating and
service workers (https://www.pwabuilder.com/serviceworker) for caching.

# Folder structure
* content: content displayed by the side, contains markup files and is parsed
  on startup to generate the navigation and the content of the page, e.g.
  content/test/foo.md, content/test2/bar.md generates the navigation
  test
   foo
  test2
   bar
  with the two pages foo and bar
* node_modules: node modules installed by npm
* public: static files served by express, e.g. public/sidenav.css is served as /sidenav.css
* views: handlebars views and layouts
* app.js the main app

# Run
* sudo node app.js

# Update
* node is installed with the synology "Paket Zentrum" and can be updated there

# ToDO
* use better service worker which detects differences when pages are updated