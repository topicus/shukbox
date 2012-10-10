(function(window){

	function PlaylistManager(){
		var that = this;
		
		this.create = function(temp){
			saved = typeof temp !== 'undefined' ? temp : false;
			if(Meteor.user()){
			    var name = 'Untitled-list';
			    var playlist = {
			    		name:name, 
			    		user:Meteor.user()._id, 
			    		saved:saved, 
			    		blocked:false, 
			    		current:-1
			    	}
			    Meteor.call('addPlaylist', playlist, function(error,response){
					if(Meteor.user()) Session.set('owner', Meteor.user()._id);                      
					Router.setList(response);
			    });    
			}
		};		
		this.set = function(listkey){
			Router.setList(listkey);
		};		
		this.setVideoToCopy = function(id){
			PlaylistManager.videoToCopy = id;
		};
		this.copyVideoToList = function(listkey){
			var video = Videos.findOne(PlaylistManager.videoToCopy);
			delete video._id;
			video.listkey = listkey;
			videos.add(video);
		};
		this.votePlaylist=function(listkey){
		    var vote = PlayLists.find({_id:listkey, voters:{$in:[Meteor.user()._id]}}).count();
		    if(!vote)
		      PlayLists.update({_id:listkey},{$inc:{score:1}, $push:{voters:Meteor.user()._id}});
		    return false;
		};	
		this.clone = function(e){
			var plo = PlayLists.findOne({_id:Session.get('listkey')});			
				delete plo._id;
				delete plo.name;
				plo.user = Meteor.user()._id;
				plo.saved = true;
				plo.name = $('#listname').val();
				plo.voters = [];
				plo.score = 0;
				plo.current = -1;
				Meteor.call('addPlaylist', plo, function(error,response){				
					Videos.find({listkey:Session.get('listkey')}).forEach(function(item){      
						videos.clone(item, response);
					});  
					var playlist = PlayLists.findOne(response);
					activity.add("listened to", playlist);
				});		
		};
		this.save = function(e) {
			Meteor.flush();
			var plo = PlayLists.findOne({_id:Session.get('listkey')});
			if(plo.user === Meteor.user()._id){
				var l = (Session.get('edited')) ? Session.get('edited') : Session.get('listkey');
				PlayLists.update({_id:l}, { $set:{name:$('#listname').val(), saved:true} });
				Session.set('edited', null);
				activity.add("listened to", plo);
			}else{
				this.clone(e);
			}
		};	
		this.del = function(t){
		    Session.set('listkey', undefined);
		    PlayLists.remove(t._id);
		    this.create();
		};	
	}
	PlaylistManager.videoToCopy = null;
	window.PlaylistManager = PlaylistManager;
})(window);