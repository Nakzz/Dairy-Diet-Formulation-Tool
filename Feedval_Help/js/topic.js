/*! HelpSmith Web Help System 2.1
* http://www.helpsmith.com
* Copyright (c) 2007-2014 Divcom Software */
$(document).ready(function(){highlightSearchWords();syncToc(topicContext)});function syncToc(b,d){if(0==top.frames.length){if("0"!==getParamValue("frames",get_getQuery())){var a="../"+getWHSettings("indexFile","index.htm")+"?context="+b,c=getQueryAnchor();""!=c&&(a+="#"+c);window.location=a}}else naviReady(function(){top.navi.setCurrentTopic(b)})};