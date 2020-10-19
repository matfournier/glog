// game.tables.getName("name of table").draw();


/** 
 * /** Future if you need to roll on a crit table 
 * 
 * 
 *  if(results.total < 15)
        {
          //fix solution
          game.packs.find(p=>p.metadata.label === "ACO Tables").getContent().then((result) =>{
            if(!result) return;

            let table = result.find(r => r.name === "Massive Damage")

            table.draw();
          });
        }
 * 
*/