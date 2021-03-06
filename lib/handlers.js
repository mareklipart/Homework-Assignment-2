const _data = require('./data');
const helpers = require('./helpers');



//---------------- define handlers

const handlers = {};

handlers.notFound = (data, callback) => {
    callback(404);
};

//---------------- define user handlers

handlers.users = (data, callback) => {

    const acceptableMethods = ['get', 'post', 'put', 'delete'];

    if (acceptableMethods.indexOf(data.method)>-1) {
        handlers._users[data.method](data, callback)
    } else {
        callback(405);
    };
};

handlers._users = {};

handlers._users.post = (data, callback) => {

    const name = typeof(data.payload.name) == 'string' && data.payload.name.length > 0 ? data.payload.name : false;
    const email = typeof(data.payload.email) == 'string' && helpers.validateEmail(data.payload.email.toLowerCase()) ? data.payload.email : false;
    const streetAddress = typeof(data.payload.streetAddress) == 'string' && data.payload.streetAddress.length > 0 ? data.payload.streetAddress : false;
    const user = typeof(data.payload.user) == 'string' && data.payload.user.trim().length >= 6 ? data.payload.user.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 6 ? data.payload.password.trim() : false;
    
    if (name && email && streetAddress && user && password) { 

        _data.read('users','user', (err, data) => {
            if(err) {
                const hashedPassword = helpers.hash(password);

                if (hashedPassword) {
                    const userObject = {
                        'name': name,
                        'email': email,
                        'streetAddress': streetAddress,
                        'user': user,
                        'password': hashedPassword
                    };

                    _data.create('users', user, userObject, err => {
                        if(!err) {
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, {'Error': 'Could not create a new user'});
                        }
                    });
                } else {
                    callback(500, {'Error': 'Could not hush the user/s password'});
                };
            } else {
                callback(400, {'Error':'A user with that user already exists'});
            };
        });
    } else {
        callback(400, {'Error': 'Missing required fields.'})
    };
};

handlers._users.get = (data, callback) => {

    const user = typeof(data.queryStringObject.user) == 'string' && data.queryStringObject.user.trim().length >= 6 ? data.queryStringObject.user : false;

    if (user) {

        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        handlers._tokens.verifyToken(token, user, isTokenvalid => {

            if(isTokenvalid) {
                _data.read('users', user, (err, data) => {
                    if (!err && data) {
                        delete data.password;
                        callback (200, data);
                    } else {
                        callback(404);
                    };
                });
            } else {
                callback(400, {'Error': 'Missing required token in header'})
            };

        });

    } else {
        callback(400, {'Error': 'Missing required field'});
    }; 

};

handlers._users.put = (data, callback) => {

    const name = typeof(data.payload.name) == 'string' && data.payload.name.length > 0 ? data.payload.name : false;
    const email = typeof(data.payload.email) == 'string' && helpers.validateEmail(data.payload.email.toLowerCase()) ? data.payload.email : false;
    const streetAddress = typeof(data.payload.streetAddress) == 'string' && data.payload.streetAddress.length > 0 ? data.payload.streetAddress : false;
    const user = typeof(data.payload.user) == 'string' && data.payload.user.trim().length >= 6 ? data.payload.user.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 6 ? data.payload.password.trim() : false;

    if (user) {
        if (name || email || streetAddress || password) {

            const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

            handlers._tokens.verifyToken(token, user, isTokenvalid => {

                if(isTokenvalid) {
                    
                    _data.read('users', user, (err, userData) => {

                        if (!err && userData) {
                            if (name) {
                                userData.name = name
                            }
                            if (email) {
                                userData.email = email
                            }
                            if (streetAddress) {
                                userData.streetAddress = streetAddress
                            }
                            if (password) {
                                userData.password = helpers.hash(password);
                            }
        
                            _data.update('users', user, userData, err => {
                                if (!err) {
                                    callback(200);
                                } else {
                                    console.log(err);
                                    callback(500, {'Error': 'Could not update the user'})
                                }
                            });
        
                        } else {
                            callback(400, {'Error': 'The specified user does not exist'});
                        };
                    });

                } else {
                    callback(400, {'Error': 'Missing required token in header'})
                };
            
            });

        } else {
            callback(400, {'Eror': 'Missing fields to update'});
        };
    } else {
        callback(400, {'Error': 'Required field missing'});
    }
    

};

handlers._users.delete = (data, callback) => {

    const user = typeof(data.queryStringObject.user) == 'string' && data.queryStringObject.user.trim().length >= 6 ? data.queryStringObject.user : false;

    if (user) {

        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        handlers._tokens.verifyToken(token, user, isTokenvalid => {

            if(isTokenvalid) {
                
                _data.read('users', user, (err, userData) => {
                    if (!err && userData) {
                        
                        _data.delete('users', user, err => {
                            if (!err) {
                                
                                callback(200);

                            } else {
                                callback(400, {'Error': 'Could not delete the specified user'})
                            }
                        });
        
                    } else {
                        callback(400, {'Error': 'Could not find the specified user'});
                    };
                });

            } else {
                callback(400, {'Error': 'Missing required token in header'})
            };
            
        });    

    } else {
        callback(400, {'Error': 'Missing required field'});
    };     

};

//---------------- define token handlers

handlers.tokens = (data, callback) => {

    const acceptableMethods = ['get', 'post', 'put', 'delete'];

    if (acceptableMethods.indexOf(data.method)>-1) {
        handlers._tokens[data.method](data, callback)
    } else {
        callback(405);
    };
};

handlers._tokens = {};


handlers._tokens.post = (data, callback) => {

    const user = typeof(data.payload.user) == 'string' && data.payload.user.trim().length >= 6 ? data.payload.user.trim() : false
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 6 ? data.payload.password.trim() : false

    if(user && password) {
        _data.read('users', user, (err, userData) => {
            if(!err && userData) {

                const hashedPassword = helpers.hash(password);

                if(hashedPassword==userData.password) {

                    const tokenId = helpers.createNewString(20);
                    const expires = Date.now() + 1000 * 60 * 60 * 60;

                    const tokenObject = {
                        'user': user,
                        'id': tokenId,
                        'expires': expires
                    };

                    _data.create('tokens', tokenId, tokenObject, err => {

                        if(!err) {
                            callback(200, tokenObject)
                        } else {
                            callback(500, {'Error': 'Could not create the new token'})
                        };

                    });

                } else {
                    callback(400, {'Error': 'The passwords do not match'});
                };

            } else {
                callback(400, {'Error': 'Could not find the specified user'});
            };
        });

    } else {
        callback (400, {'Error': 'Missing required fields'})
    }


};

handlers._tokens.get = (data, callback) => {

    const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id : false;

    if (id) {
        _data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                callback (200, tokenData);
            } else {
                callback(404);
            };
        });
    } else {
        callback(400, {'Error': 'Missing required field'});
    }; 

    
};

handlers._tokens.put = (data, callback) => {
    
    const id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    const extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? data.payload.extend : false;

    if(id && extend) {

        _data.read('tokens', id, (err, tokenData) => {

            if(!err && tokenData) {

                if(tokenData.expires > Date.now()) {

                    tokenData.expires = Date.now() + 1000 * 60 * 60 * 60;

                    _data.update('tokens', id, tokenData, err => {

                        if(!err) {
                            callback(200);
                        } else {
                            callback(500, {'Error': 'Could not extend tokens expiration'})
                        };

                    });

                } else {
                    callback(400, {'Error': 'The token has already expired, cannot be extended'})
                }

            } else {
                callback(400, {'Error': 'Specified token does not exist'});
            };

        });

    } else {
        callback(400, {'Error': 'Missing required fields'});
    };
};

handlers._tokens.delete = (data, callback) => {

    const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id : false;

    if (id) {
        _data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                
                _data.delete('tokens', id, err => {
                    if (!err) {
                        callback(200);
                    } else {
                        callback(400, {'Error': 'Could not delete the specified token'})
                    }
                });

            } else {
                callback(400, {'Error': 'Could not find the specified token'});
            };
        });
    } else {
        callback(400, {'Error': 'Missing required field.'});
    };
    
};



handlers._tokens.verifyToken = (id, user, callback) => {

    _data.read('tokens', id, (err, tokenData) => {
        if (!err && tokenData) {
            if (tokenData.user == user && tokenData.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }

    });

}

//---------------- define menu handlers

handlers.menu = (data, callback) => {

    const acceptableMethods = ['get'];

    if (acceptableMethods.indexOf(data.method)>-1) {
        handlers._menu[data.method](data, callback)
    } else {
        callback(405);
    };
};

handlers._menu = {};

handlers._menu.get = (data, callback) => {

    const user = typeof(data.queryStringObject.user) == 'string' && data.queryStringObject.user.trim().length >= 6 ? data.queryStringObject.user : false;

    if (user) {
 
        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        handlers._tokens.verifyToken(token, user, isTokenvalid => {

            if(isTokenvalid) {
                _data.read('menu', 'menu', (err, data) => {
                    if (!err && data) {
                        callback (200, data);
                    } else {
                        callback(404);
                    };
                });
            } else {
                callback(400, {'Error': 'Missing required token in header'})
            };

        });

    } else {
        callback(400, {'Error': 'Missing required field'});
    }; 

};

//---------------- define cart handlers

handlers.cart = (data, callback) => {

    const acceptableMethods = ['get', 'post', 'put', 'delete'];

    if (acceptableMethods.indexOf(data.method)>-1) {
        handlers._cart[data.method](data, callback)
    } else {
        callback(405);
    };
};

handlers._cart = {};


handlers._cart.post = (data, callback) => {

    const items = typeof(data.payload.items) == 'object' && data.payload.items.length > 0 ? data.payload.items : false;
    const user = typeof(data.payload.user) == 'string' && data.payload.user.length > 0 ? data.payload.user : false;

    if (user && items) {

        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        handlers._tokens.verifyToken(token, user, isTokenvalid => {

            if(isTokenvalid) {

                _data.read('carts', user, (err, data) => {
                    if(err) {
                                
                        _data.read('menu', 'menu', (err, data) => {
                            if (!err && data) {

                                const cartObject = {};
                                cartObject.items = [];

                                items.forEach(id => {

                                    for(let i=0; i<data.menu.items.length; i++) {
                                        if(id == data.menu.items[i].id) {
                                            cartObject.items.push(data.menu.items[i]);
                                        }
                                    }   

                                });

                                _data.create('carts', user, cartObject, err => {
                                    if(!err) {
                                        callback(200);
                                    } else {
                                        console.log(err);
                                        callback(500, {'Error': 'Could not create a new cart'});
                                    }
                                });
                                
                            } else {
                                callback(404, {'Error': 'Could not read menu'});
                            };
                        });

                    } else {
                        callback(400, {'Error':'A cart with that user already exists'});
                    };
                });


            } else {
                callback(400, {'Error': 'Missing required token in header'})
            };

        });

    } else {
        callback(400, {'Error': 'Missing required field'});
    }; 
};

handlers._cart.get = (data, callback) => {

    const user = typeof(data.queryStringObject.user) == 'string' && data.queryStringObject.user.trim().length >= 6 ? data.queryStringObject.user : false;

    if (user) {

        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        handlers._tokens.verifyToken(token, user, isTokenvalid => {

            if(isTokenvalid) {
                _data.read('carts', user, (err, data) => {
                    if (!err && data) {
                        callback (200, data);
                    } else {
                        callback(404);
                    };
                });
            } else {
                callback(400, {'Error': 'Missing required token in header'})
            };

        });

    } else {
        callback(400, {'Error': 'Missing required field'});
    }; 

};

handlers._cart.put = (data, callback) => {

    const items = typeof(data.payload.items) == 'object' && data.payload.items.length > 0 ? data.payload.items : false;
    const user = typeof(data.payload.user) == 'string' && data.payload.user.length > 0 ? data.payload.user : false;

    if (user && items) {

        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        handlers._tokens.verifyToken(token, user, isTokenvalid => {

            if(isTokenvalid) {

                _data.read('carts', user, (err, data) => {
                    if(!err && data) {
                                
                        _data.read('menu', 'menu', (err, data) => {
                            if (!err && data) {

                                const cartObject = {};
                                cartObject.items = [];

                                items.forEach(id => {

                                    for(let i=0; i<data.menu.items.length; i++) {
                                        if(id == data.menu.items[i].id) {
                                            cartObject.items.push(data.menu.items[i]);
                                        }
                                    }   

                                });

                                _data.update('carts', user, cartObject, err => {
                                    if(!err) {
                                        callback(200);
                                    } else {
                                        console.log(err);
                                        callback(500, {'Error': 'Could not create a new cart'});
                                    }
                                });
                                
                            } else {
                                callback(404, {'Error': 'Could not read menu'});
                            };
                        });

                    } else {
                        callback(400, {'Error':'Could not read the cart'});
                    };
                });


            } else {
                callback(400, {'Error': 'Missing required token in header'})
            };

        });

    } else {
        callback(400, {'Error': 'Missing required field'});
    }; 
};

handlers._cart.delete = (data, callback) => {

    const user = typeof(data.queryStringObject.user) == 'string' && data.queryStringObject.user.trim().length >= 6 ? data.queryStringObject.user : false;

    if (user) {

        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        handlers._tokens.verifyToken(token, user, isTokenvalid => {

            if(isTokenvalid) {
                
                _data.read('carts', user, (err, userData) => {
                    if (!err && userData) {
                        
                        _data.delete('carts', user, err => {
                            if (!err) {
                                
                                callback(200);

                            } else {
                                callback(400, {'Error': 'Could not delete the specified cart'})
                            }
                        });
        
                    } else {
                        callback(400, {'Error': 'Could not find the specified cart'});
                    };
                });

            } else {
                callback(400, {'Error': 'Missing required token in header'})
            };
            
        });    

    } else {
        callback(400, {'Error': 'Missing required field'});
    };     

};

//---------------- define order handlers


handlers.orders = (data, callback) => {

    const acceptableMethods = ['get', 'post', 'put', 'delete'];

    if (acceptableMethods.indexOf(data.method)>-1) {
        handlers._orders[data.method](data, callback)
    } else {
        callback(405);
    };
};

handlers._orders = {};


handlers._orders.post = (data, callback) => {

    const user = typeof(data.payload.user) == 'string' && data.payload.user.length > 0 ? data.payload.user : false;

    if (user) {

        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        handlers._tokens.verifyToken(token, user, isTokenvalid => {

            if(isTokenvalid) {

                _data.read('carts', user, (err, data) => {
                    if(!err) {

                        _data.create('orders', user, data, err => {
                            if(!err) {

                                let amount = 0;
                                data.items.forEach(element => {
                                    amount += element.price;
                                });

                                helpers.createCharge(amount, err => {
                                    
                                    if (!err) {
                                        _data.delete('carts', user, err => {

                                            if (!err) {
                                
                                                _data.read('users', user, (err, data) => {
                                                    if (!err && data) {

                                                        const txt = `::Order receipt:: total paid: $${amount} ::thank you!::`;
                                                        const email = data.email;

                                                        helpers.sendMailgun(email, txt, err => {
                                                            if (!err) {
                                                                callback(200);
                                                            } else {
                                                                callback(500, {'Error': 'Could not send an email'});
                                                            };
                                                        });
                                                        
                                                    } else {
                                                        callback(404, {'Error': 'Could not read the user data'});
                                                    };
                                                });
                                                
                                            } else {
                                                callback(400, {'Error': 'Could not delete the specified cart'})
                                            }

                                        }); 
                                    } else {
                                        callback(500, {'Error': 'Could not create a charge'});
                                    }
                                });

                            } else {
                               callback(500, {'Error': 'Could not create a new order'});
                            }
                        });

                    } else {
                        callback(400, {'Error':'A cart with that user does not exists'});
                    };
                });

            } else {
                callback(400, {'Error': 'Missing required token in header'})
            };

        });

    } else {
        callback(400, {'Error': 'Missing required field'});
    }; 
};

//---------------- export module

module.exports = handlers; 