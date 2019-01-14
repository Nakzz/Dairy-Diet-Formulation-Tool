/*! HelpSmith Web Help System 2.1
* http://www.helpsmith.com
* Copyright (c) 2007-2014 Divcom Software */
$(document).ready(function(){$(window).resize(function(){alignDocument()});alignDocument()});function alignDocument(){var b=$("#non-scrolling-area"),a=$("#container"),d=a.find("#content-background"),c=a.find("#content");a.css({top:b.position().top+b.outerHeight(!0)+"px",height:$(window).innerHeight()-b.outerHeight(!0)+"px"});d.css("height",(c.innerHeight()>a.height()?c.innerHeight():a.height())+"px")};