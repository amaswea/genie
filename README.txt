# README file for EvoWeb source

The EvoWeb code consists of four main classes, a background and content script to control the Chrome extension, and  several supporting scripts explained below. 

The four main classes are: 

analyzer.js - Contains all logic for difference detection and grouping, and performs type inference and ranking on a set of detected changes after they are found. 

collector.js - Contains the main Node data structure that is collected to snapshot each DOM node, and it takes a capture of each paid with the Node structure for each node, and returns a list of nodes for that page. 


extractor.js - This class is in charge of extracting DOM nodes for the context and summary views of the EvoWeb interface. This is where nodes are duplicated, and also where the main webpage is scaled down to create the summary and context panel. 

notifier.js - Controls and builds the right hand list of changes, draws the highlighters over the currently hovered elements in the summary panel, and draws the canvas to the highlighter. 

The supporting classes are: 

background.js - Sends messages to the content script retrive the capture for the current page, and to retrieve the capture from the page DB, Triggers the change analysis when both of these are retrieved. 

content.js - Triggers the page capture when it receives a message from the background script. Triggers the EvoWeb interface to open when a message is returned. 

db.js - Controls communication to the IndexedDB instance, performs CRUD operations

parser.js - The analyzer class calls into the parser to retrieve a list of Enlish, POS tagged tokens for a DOM node. 

popup.js/popup.html - Creates a popup with buttons for creating captures on demand. Needs to be referenced in the manifest.json file to appear.

manifest.json - Chrome extension settings file. 

The referenced POS tagger and English word detectors are: 

typo.js - An open source library, JavaScript implementation of a spellchecker using hunspell-style dictionaries. https://github.com/cfinke/Typo.js/

POSTagger.js - Copyright 2010, Percy Wegmann
 * Licensed under the LGPLv3 license
 * http://www.opensource.org/licenses/lgpl-3.0.html
 - use lexer.js, lexicon.js under scripts/jspos




