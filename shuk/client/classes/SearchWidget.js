(function(window){
	function SearchWidget(){	

		
		var that = this;

		this.get_youtube_id = function(url){
		    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
		    var match = url.match(regExp);
		    if (match&&match[7].length==11){
		        return match[7];
		    }
		    return false;
		};
		this.showMyVideos = function(data){
		    var feed = data.feed;
		    var entries = feed.entry || [];
		    var html = ['<ul id="autocompleter">'];
		    for (var i = 0; i < entries.length; i++)
		    {
		        var entry = entries[i];
		        var playCount = entry.yt$statistics.viewCount.valueOf() + ' views';
		        var title = entry.title.$t;
		        var thumb = entry.media$group.media$thumbnail[3].url;
		        var thumb_height = entry.media$group.media$thumbnail[3].height * 0.5;
		        var thumb_width = entry.media$group.media$thumbnail[3].width * 0.5;
		        var thumb_tag = '<div style="height:'+thumb_height+'px; width:'+thumb_width+'px" class="thumb-search"><img src="'+thumb+'"/></div>'
		        var lnk = '<a data-thumb="'+thumb+'" title="'+entry.title.$t+'" href = \"' + entry.link[0].href + '\"></a>';
		        html.push('<li>', thumb_tag, title, ', ', playCount, ', ', lnk, '</li>');
		    }
		    html.push('<li><span class="more-videos">+More Videos</span></li>');
		    html.push('</ul>');
		    document.getElementById('videoResultsDiv').innerHTML = html.join('');
		    var autocompleter = $('#autocompleter li');
		    autocompleter.click(function(e){
		      if($(e.currentTarget).index()==autocompleter.length-1){
		        that.autocomple_offset +=that.AUTOCOMPLETE_PAGE_SIZE;
		        that.search(document.getElementById('nextsong').value, that.AUTOCOMPLETE_PAGE_SIZE);        
		        that.currentSelected=-1;
		        $(e.currentTarget).find('span').html('Loading...');
		      }else{
		        var $video = $(this);
		        var vid =that.get_youtube_id($video.children('a').attr("href"));
		        var title = $video.children('a').attr("title");        
		        videos.add({vid:vid,title:title});
		        $("#autocompleter").hide();
		        that.currentSelected = -1;
		        $('.nextsong').val('');          
		      }      
		    });
		};
		this.parseFeed = function(data){
			var feed = data.feed;
			var entries = feed.entry || [];
			var html = ['<ul id="autocompleter">'];
			_.each(entries,function(entry){
		        var playCount = entry.yt$statistics.viewCount.valueOf() + ' views';
		        var title = entry.title.$t;
		        var thumb = entry.media$group.media$thumbnail[3].url;
		        var thumb_height = entry.media$group.media$thumbnail[3].height * 0.5;
		        var thumb_width = entry.media$group.media$thumbnail[3].width * 0.5;	
	        	var thumb_tag = '<div style="height:'+thumb_height+'px; width:'+thumb_width+'px" class="thumb-search"><img src="'+thumb+'"/></div>'
		        var lnk = '<a data-thumb="'+thumb+'" title="'+entry.title.$t+'" href = \"' + entry.link[0].href + '\"></a>';
		        html.push('<li>', thumb_tag, title, ', ', playCount, ', ', lnk, '</li>');		        			
			});	
		    html.push('<li><span class="more-videos">+More Videos</span></li>');
		    html.push('</ul>');
		    document.getElementById('videoResultsDiv').innerHTML = html.join('');
		    var autocompleter = $('#autocompleter li');
		    autocompleter.click(function(e){
		      if($(e.currentTarget).index()==autocompleter.length-1){
		        that.autocomple_offset +=that.AUTOCOMPLETE_PAGE_SIZE;
		        that.search(document.getElementById('nextsong').value, that.AUTOCOMPLETE_PAGE_SIZE);        
		        that.currentSelected=-1;
		        $(e.currentTarget).find('span').html('Loading...');
		      }else{
		        var $video = $(this);
		        var vid = that.get_youtube_id($video.children('a').attr("href"));
		        var title = $video.children('a').attr("title");        
		        videos.add({vid:vid,title:title});
		        $("#autocompleter").hide();
		        that.currentSelected = -1;
		        $('.nextsong').val('');          
		      }      
		    });				
		};
		this.addFeeds = function(feeds){
			//todo
		};
		this.search = function(q){
			if(that.search_timeout) clearTimeout(search_timeout);			
			if(q!==''){
				search_timeout = setTimeout(function(){
					var offset = (typeof(that.autocomple_offset) !== 'undefined')? that.autocomple_offset : 1;
					var url = 'http://gdata.youtube.com/feeds/' + 
				              'videos?vq='+q+'&max-results='+that.AUTOCOMPLETE_PAGE_SIZE+'&' + 
				              'alt=json-in-script&' +
				              'start-index='+offset+'&' +
				              'orderby=relevance&sortorder=descending&format=5&fmt=18'
						$.ajax({
							type: 'GET',
							url: url,
							async: false,
							contentType: "application/json",
							dataType: 'jsonp',
							success: function(response) {
								that.parseFeed(response);
							},
							error: function(e) {
							   alert(e.message);
							}
						});
				}, 200);
			}else{
				document.getElementById("autocompleter").style.display = 'none';
			}		
		};
		var addInputEvent = function(){
		  var inputnode = document.getElementById("nextsong");
		  that.old_input_state = inputnode.value;
		  that.timer_input_event = Meteor.setInterval(function(){
		    if(that.old_input_state !== inputnode.value){
		      that.search(inputnode.value);
		      that.old_input_state = inputnode.value;
		      that.autocomple_offset = 1;
		    }
		    if(inputnode.value===''){
		      var autocompleter = document.getElementById("autocompleter");
		      if(autocompleter) autocompleter.style.display = 'none';
		      currentSelected = -1;
		    }
		  }, 100);
		}
		var removeInputEvent = function(){
		  Meteor.clearInterval(timer_input_event);
		}		

	};

	SearchWidget.prototype.CONTROL_KEYCODES = new Array(40,38,37,39)
	SearchWidget.prototype.ENTER = 13;
	SearchWidget.prototype.ESC = 27;
	SearchWidget.prototype.AUTOCOMPLETE_PAGE_SIZE = 5;
	SearchWidget.prototype.currentSelected = -1;
	SearchWidget.prototype.old_input_state = '';
	SearchWidget.prototype.timer_input_event = null;
	SearchWidget.prototype.search_timeout = null;
	SearchWidget.prototype.autocomple_offset = 1;

	window.SearchWidget = SearchWidget;
})(window);