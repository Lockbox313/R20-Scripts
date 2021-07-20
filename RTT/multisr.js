on('ready',()=>{
    const playerCanControl = (obj, playerid='any') => {
        const playerInControlledByList = (list, playerid) => playerIsGM(playerid) || list.includes('all') || list.includes(playerid) || ('any'===playerid && list.length);
        let players = obj.get('controlledby')
            .split(/,/)
            .filter(s=>s.length);

        if(playerInControlledByList(players,playerid)){
            return true;
        }

        if('' !== obj.get('represents') ) {
            players = (getObj('character',obj.get('represents')) || {get: function(){return '';} } )
                .get('controlledby').split(/,/)
                .filter(s=>s.length);
            return  playerInControlledByList(players,playerid);
        }
        return false;
    };

	const getTurnArray = () => ( '' === Campaign().get('turnorder') ? [] : JSON.parse(Campaign().get('turnorder')));
	const addTokenTurn = (id, pr) => Campaign().set({ turnorder: JSON.stringify( [...getTurnArray(), {id,pr}]) });
	const removeTokenTurn = (tid) => Campaign().set({ turnorder: JSON.stringify( getTurnArray().filter( (to) => to.id !== tid)) });
	const clearTurnOrder = () => Campaign().set({turnorder:'[]'});
	const sorter_asc = (a, b) => a.pr - b.pr;
	const sorter_desc = (a, b) => b.pr - a.pr;
	const sortTurnOrder = (sortBy = sorter_desc) => Campaign().set({turnorder: JSON.stringify(getTurnArray().sort(sortBy))});


    const processInlinerolls = (msg) => {
        if(_.has(msg,'inlinerolls')){
            return _.chain(msg.inlinerolls)
                .reduce(function(m,v,k){
                    let ti=_.reduce(v.results.rolls,function(m2,v2){
                        if(_.has(v2,'table')){
                            m2.push(_.reduce(v2.results,function(m3,v3){
                                m3.push(v3.tableItem.name);
                                return m3;
                            },[]).join(', '));
                        }
                        return m2;
                    },[]).join(', ');
                    m['$[['+k+']]']= (ti.length && ti) || v.results.total || 0;
                    return m;
                },{})
                .reduce(function(m,v,k){
                    return m.replace(k,v);
                },msg.content)
                .value();
        } else {
            return msg.content;
        }
    };

    on('chat:message', (msg)=>{
        if('api'===msg.type && /^!multisr\b/i.test(msg.content)){

            let cmds = processInlinerolls(msg).split(/\s+/).splice(1);
            let flags = cmds.filter((o)=>/^--/.test(o)).map((s)=>s.toLowerCase());
            let turns = cmds.filter((o)=>!/^--/.test(o)).map((s)=>parseFloat(s)||0.00);
            let tokens = msg.selected
                .map(o=>getObj('graphic',o._id))
                .filter(g=>undefined !== g)
				;

            flags.forEach(f=>{
                switch(f){
                    case '--clear':
                        tokens.forEach(t => {
                            if(playerCanControl(t,msg.playerid)){
                                removeTokenTurn(t.id);
                            }
                        });
                        break;

                    case '--clear-all':
                        if(playerIsGM(msg.playerid)){
                            clearTurnOrder();
                        }
                        break;

                }
            });

            tokens.forEach( t => turns.forEach( pr => addTokenTurn(t.id,pr)));

            flags.forEach(f=>{
                switch(f){
                    case '--sort-desc':
                        if(playerIsGM(msg.playerid)){
                            sortTurnOrder(sorter_desc);
                        }
                        break;

                    case '--sort-asc':
                        if(playerIsGM(msg.playerid)){
                            sortTurnOrder(sorter_asc);
                        }
                        break;
                }
            });
        }
    });
});
