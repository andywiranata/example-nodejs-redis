const redisRef = require('./redis/redisRef.js');
const sqlite3 = require('sqlite3').verbose();  
const db = new sqlite3.Database('example-sqlite.db');  

const query = 'SELECT * FROM albums';
const keyAlbums = 'keyAlbums';
const expire = 20;

console.time('Query_time');

redisRef.lrange(keyAlbums, 0, -1,(err, value)=>{
	if(err){
		console.log(err);
	}

	if(value.length > 0){
		const jsonFirstIndexVal = JSON.parse(value[0]);
		console.log('redis cache value :', jsonFirstIndexVal.Title);
		console.timeEnd('Query_time')

	}else{

		db.serialize(()=> {    
			db.all(query, (err, value)=> {  
				
				if(err){
					console.log(err);
				}

				if(value){
					console.log("SQL query, total row: ", value.length)
					console.timeEnd('Query_time');
					value.map((val, index)=>{
						// console.log("JSON stringify ", JSON.stringify(val));
						redisRef.rpush(keyAlbums, JSON.stringify(val), (err)=>{

							if(err){
								console.log(err);
							}
							redisRef.expire(keyAlbums, expire);

						});

					});


				}

			});  
		});  
		
		db.close();  
	}
});
  

