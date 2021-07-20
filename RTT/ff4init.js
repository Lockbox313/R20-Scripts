on('ready', () => {
    on('chat:message',(msg) => {

        if('api' === msg.type) {
            if(msg.content.match(/^![ar]tt\b/) ){
                let who=(getObj('player',msg.playerid)||{get:()=>'API'}).get('_displayname');
                let replace=/^!rtt/.test(msg.content);

                if(_.has(msg,'inlinerolls')){
                    msg.content = _.chain(msg.inlinerolls)
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
                }

                let text = msg.content.split(/\s+/).slice(1).join(' ');
                if(text){
                    let turns = (msg.selected||[])
                        .map((o)=>getObj('graphic',o._id))
                        .filter( o=> undefined !== o)
                        .map((t)=>({id: t.id, pr: text}));
                    let ids = turns.map(t=>t.id);

                    if(turns.length){
                        let oldTo = (JSON.parse(Campaign().get('turnorder'))||[]).filter(t=>(replace ? !ids.includes(t.id) : true ));
                        let to=turns.concat(oldTo);
                        Campaign().set('turnorder',JSON.stringify(to));
                    } else {
                        sendChat('ATT',`/w "${who}" <div style="padding:1px 3px;border: 1px solid #8B4513;background: #eeffee; color: #8B4513; font-size: 80%;"><div style="background-color: #ffeeee;">Nothing selected capable of having a turn.</div></div>`);
                    }
                } else {
                    sendChat('ATT',`/w "${who}" <div style="padding:1px 3px;border: 1px solid #8B4513;background: #eeffee; color: #8B4513; font-size: 80%;"><div style="background-color: #ffeeee;">Use <b><pre>!act ${'&'+'lt'+';'}text${'&'+'gt'+';'}</pre> -- add turns for selected tokens with the supplied text as the value of their turn.</b></div></div>`);
                }
            }
        }
    });
})