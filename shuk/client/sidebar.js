
Session.set('latestlists', null);

Template.latestlist.latest = function(argument) {
	return LatestLists.find({});
};
Template.latestlist.events = {
	'click li':function(e){
		playManager.setList(this._id);
	}	
};
getLatestLists();
function getLatestLists(){
	Meteor.call('getLatestLists', function(error, response){
		Session.set('latestlists', response);
	});
};