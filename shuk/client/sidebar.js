
Session.set('latestlists', null);

Template.latestlist.latest = function(argument) {
	return LatestLists.find( {},{sort:{when:-1}} );
};
Template.latestlist.events({
	'click li':function(e){
		playManager.setList(this._id);
	}	
});