/*! HelpSmith Web Help System 2.1
* http://www.helpsmith.com
* Copyright (c) 2007-2014 Divcom Software */
$(document).ready(function(){var b=$("frame[name=topic]"),a=getTopicFromQuery(b.attr("src"));if(!1===a)a="unknown.htm";else{var c=getQueryAnchor();""!=c&&(a+="#"+c)}naviReady(function(){b.attr("src",a)})});