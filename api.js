const express =  require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser')
const server = new express();
 
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/vdw-kerst');
server.use(cors());
server.use(bodyParser());


const Users = mongoose.model('User', {
    name: String,
    image: String,
    color: String,
    purchases: [],
    items: [{
        product: String,
        link: String,
        price: String,
        factor: Number,
        bought: {
            type: Number,
            default: false,
        },
    }] 
});


server.get('/', (r, res) => { return res.send('<img src="https://i.imgur.com/DzfVJox.gif"/>')});

server.get('/users', async (req, res) => {
    try {
        const users = await Users.find({}, ['name', 'color','image']);
        res.json(users.reverse());
    } catch (error) {
        console.log(error);
        res.status(400).json({
            error: 'Something went wrong.'
        });
    }
});

server.post('/users/:id', async (req, res) => {
    try {
        const user = await Users.findOne({_id: req.params.id});
        user.items.push({
            product: req.body.product,
            link: req.body.link,
            price: req.body.price,
            factor: parseInt(req.body.factor || 1, 10),
        });
        await user.save();

        return res.json(user);
    } catch (error) {
        console.log(error);
        res.status(400).json({
            error: 'Something went wrong.'
        });
    }
});

server.get('/users/:id', async (req, res) => {
    try {
        const user = await Users.findOne({_id: req.params.id});
        return res.json(user);
    } catch (error) {
        console.log(error);
        res.status(400).json({
            error: 'Something went wrong.'
        });
    }
});


server.get('/users/:id/overview', async (req, res) => {
    try {
        const response = [];
        const users = await Users.find({_id: {$ne: req.params.id}});

        users.forEach((user) => {
            user.items.forEach((item) => {
                if (item.bought) {
                    return;
                }
                response.push({
                    user, item
                })
            });
        });
        return res.json(response);
    } catch (error) {
        console.log(error);
        res.status(400).json({
            error: 'Something went wrong.'
        });
    }
});

server.post('/users/:id/purchases', async (req, res) => {
    try {
        const user = await Users.findOne({_id: req.params.id});
        user.purchases.push({item: req.body._id});

        const itemUser = await Users.findOne({'items._id': req.body._id});
        itemUser.items = itemUser.items.map((item) => {
            if (item._id == req.body._id) {
                item.bought = true;
            }
            return item;
        })

        await user.save();
        await itemUser.save();
        return res.json(true);
    } catch (error) {
        console.log(error);
        res.status(400).json({
            error: 'Something went wrong.'
        });
    }
});

console.log('server started');
server.listen(process.env.PORT || 7773);
