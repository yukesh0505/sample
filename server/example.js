'use strict';

module.exports = function (express, mongoose) {

    var Boom = require('boom'),
        Joi = require('joi'),
        querystring = require('querystring'),
        User = require("../models/user").getModel(),
        videos = require("../models/videos").getModel(),
        Job = require("../models/renderjobs").getModel(),
        Musiclibrary = require("../models/musiclibrary").getModel(),
        Uploades = require("../models/uploads").getModel(),
        RestHandler = require('../lib/restHandler'),
        ActivityLogger = require("../lib/activityLogger"),
        // http = require('http'),
        request = require('request')

    var config = require('../config/config.' + process.env.ENVIRONMENT);

    var router = express.Router();

    var AWS = require('aws-sdk');
    AWS.config.update({
        accessKeyId: config.aws.AccessKey,
        secretAccessKey: config.aws.SecretAccessKey,
        region: config.aws.Region
    });

    var submitRenderJob = function (jobid, callback) {
        var batch = new AWS.Batch();

        var params = {
            jobDefinition: 'multimedia5_render', /* required */
            jobName: 'Render-' + jobid, /* required */
            jobQueue: 'Multimedia5_Render', /* required */
            containerOverrides: {
                environment: [
                    {
                        name: 'ENVIRONMENT',
                        value: process.env.ENVIRONMENT
                    },
                    {
                        name: 'JOBID',
                        value: jobid.toString()
                    },
                ]
            },
            retryStrategy: {
                attempts: 2
            },
            timeout: {
                attemptDurationSeconds: 1000
            }
        };
        console.log("JOB_SUBMITTED", params);
        batch.submitJob(params, function (err, data) {
            if (err) {
                console.log(err, err.stack); // an error occurred
                callback(0, err)
            } else {
                console.log(data);           // successful response
                callback(1)
            }
        });
    }

    var videosroute = {

        createvideo: function (req, res) {
            console.log("create video date");
            var data = {};

            if (req.body) {
                data = req.body;
                data.createdby = req.headers['userid'];
                // name: req.body.name
            }
            console.log(data, "final data")
            if (req.body._id) {
                console.log("save update video first:")
                var vidduration = 0;
                var query = {
                    "_id": req.headers['userid']
                }
                var update = {
                    "firstvideo_flag": true
                }
                User.findOneAndUpdate(query, update)
                    .exec(function (err, user) {
                        if (err) {
                            res.send({ status: 'error', retcode: 1, reason: err });
                        }
                        if (user) {
                            data.updated_at = Date.now();
                            videos.findOneAndUpdate({ _id: req.body._id }, data, function (err, result) {
                                if (!err) {
                                    // updating size information
                                    User.findOne({ _id: req.headers['userid'] }).exec(function (err, userdata) {
                                        if (!err) {
                                            var size = userdata.storage_usedsize;
                                            console.log(req.body.branding.outroup, req.body.branding.waterup, "uplodes:")
                                            if (req.body.branding.outroup == true) {
                                                if (req.body.branding.oldoutro_imagesize) {
                                                    size = size - req.body.branding.oldoutro_imagesize;
                                                }
                                                size = size + req.body.branding.outro_imagesize;
                                            }
                                            if (req.body.branding.waterup == true) {
                                                if (req.body.branding.oldwater_imagesize) {
                                                    size = size - req.body.branding.oldwater_imagesize;
                                                }
                                                size = size + req.body.branding.oldwater_imagesize;
                                            }
                                            userdata.storage_usedsize = size;
                                            User.findOneAndUpdate(query, userdata)
                                                .exec(function (err, user) {
                                                    if (err) {
                                                        console.log(err, "Error");
                                                    }
                                                    if (user) {
                                                        var limit;
                                                        if (user.plan == "free") {
                                                            limit = 1024
                                                        } else if (user.plan == "premium") {
                                                            limit = 2024
                                                        } else if (user.plan == "business") {
                                                            limit = 5024
                                                        } else if (user.plan == "enterprise") {
                                                            limit = 10000024
                                                        }
                                                        console.log(user, "userdetails")
                                                        var percentage = Math.ceil(user.storage_usedsize / limit * 100)
                                                        var email = user.useremail;
                                                        var storage_usedsize = percentage;
                                                        var plan = user.plan;
                                                        var subscription_type = user.subscription_type;
                                                        var subscription_enddate = user.subscription_enddate;

                                                        var url = "https://api.intercom.io/users";
                                                        var query = user.email;

                                                        var post_options = {
                                                            uri: 'https://api.intercom.io/users',
                                                            method: 'POST',
                                                            headers: {
                                                                'Authorization': 'Bearer dG9rOjcyNGM4MmU2XzIzNzlfNDE3Ml9iYmIyX2U3MDRkNTI2NWRmYjoxOjA=',
                                                                'Accept': "application/json",
                                                                'Content-Type': "application/json",
                                                            },
                                                            json: {
                                                                "email": email,
                                                                "custom_attributes": {
                                                                    "Data Storage": storage_usedsize,
                                                                    "Price Plan": plan,
                                                                    "Subscription Type": subscription_type,
                                                                    "Subscription End Date": subscription_enddate
                                                                }
                                                            }
                                                        };
                                                        request(post_options, function (error, response, body) {
                                                            if (!error) {
                                                                console.log(body);
                                                                res.send({ status: 'success', retcode: 0, data: result, user: user });
                                                            } else {
                                                                console.log(err);
                                                                console.error(' Error   communicating   with   VideoBlocks   API');
                                                            }
                                                        });

                                                        // res.send({ status: 'success', retcode: 0, data: result, user: user });
                                                    }
                                                });
                                        } else {
                                            console.log("Error");
                                        }
                                    })

                                } else {
                                    res.send({ status: 'error', retcode: 1, reason: err });
                                }
                            });
                        }
                    });
            } else {
                // console.log("data :", data);
                console.log("save video first:")
                var query = {
                    "_id": req.headers['userid']
                }
                var update = {
                    "firstvideo_flag": true
                }
                User.findOneAndUpdate(query, update)
                    .exec(function (err, user) {
                        if (err) {
                            res.send({ status: 'error', retcode: 1, reason: err });
                        }
                        if (user) {
                            console.log("user found", user);
                            data.label = data.title;
                            var newvideos = new videos(data);
                            newvideos.save(function (err, videodata) {
                                if (err) {
                                    res.send({ status: 'error', retcode: 1, reason: err });
                                } else {
                                    videos.find({ 'createdby': req.headers['userid'] }).exec(function (err, videolist) {
                                        if (err) {
                                            res.send({ status: 'error', retcode: 1, reason: err });
                                        } else {
                                            if (videolist) {
                                                var total_videocreated = videolist.length;
                                                data = {
                                                    total_videocreated: videolist.length
                                                }
                                                console.log(total_videocreated)
                                                User.findOneAndUpdate(query, data)
                                                    .exec(function (err, user) {
                                                        if (err) {
                                                            res.send({ status: 'error', retcode: 1, reason: err });
                                                        } else {
                                                            var post_options = {
                                                                uri: 'https://api.intercom.io/users',
                                                                method: 'POST',
                                                                headers: {
                                                                    'Authorization': 'Bearer dG9rOjcyNGM4MmU2XzIzNzlfNDE3Ml9iYmIyX2U3MDRkNTI2NWRmYjoxOjA=',
                                                                    'Accept': "application/json",
                                                                    'Content-Type': "application/json",
                                                                },
                                                                json: {
                                                                    "email": user.useremail,
                                                                    "custom_attributes": {
                                                                        "total_videocreated": total_videocreated
                                                                    }
                                                                }
                                                            };
                                                            request(post_options, function (error, response, body) {
                                                                if (!error) {
                                                                    console.log(body);
                                                                    res.send({ status: 'success', retcode: 0, data: videodata });
                                                                } else {
                                                                    console.log(err);
                                                                    console.error(' Error   communicating   with   VideoBlocks   API');
                                                                }
                                                            });
                                                        }
                                                    })
                                            }
                                        }

                                    })
                                }
                            })
                        }
                    });
            }
        },

        getvideo: function (req, res) {
            console.log(" get video details");
            var query = {}
            if (req.query.videoid) {
                query = { '_id': req.query.videoid }
            }
            videos.findOne(query)
                .populate('createdby')
                .exec(function (err, content) {
                    if (!err) {
                        res.send({ status: 'success', retcode: 0, data: content });
                    } else {
                        res.send({ status: 'error', retcode: 1, reason: err });
                    }
                });
        },
        getdraft: function (req, res) {
            console.log("Draft video")
            videos.find({ 'createdby': req.headers['userid'], $or: [{ status: 'created' }, { status: 'waiting' }] })
                .populate('createdby')
                .exec(function (err, content) {
                    if (!err) {
                        res.send({ status: 'success', retcode: 0, data: content });
                    } else {
                        res.send({ status: 'error', retcode: 1, reason: err });
                    }
                });
        },
        getpublished: function (req, res) {
            console.log("published video");
            videos.find({ 'createdby': req.headers['userid'], status: 'published' })
                .populate('createdby')
                .exec(function (err, content) {
                    if (!err) {
                        res.send({ status: 'success', retcode: 0, data: content });
                    } else {
                        res.send({ status: 'error', retcode: 1, reason: err });
                    }
                });
        },
        getproducedvideo: function (req, res) {
            console.log("published video");
            var searchquery = {};
            if (req.query.searchname) {
                if (req.query.searchname != 'undefined') {
                    var name = req.query.searchname;
                    searchquery.title = new RegExp(name, 'i');
                }
            }
            if (req.query.searchcategory) {
                if (req.query.searchcategory != '') {
                    searchquery.video_category = req.query.searchcategory;
                }
            }
            searchquery.createdby=req.headers['userid']
            searchquery.status="completed"


            videos.find(searchquery).sort({ updated_at: -1 })
                .populate('createdby')
                .exec(function (err, content) {
                    if (!err) {
                        res.send({ status: 'success', retcode: 0, data: content });
                    } else {
                        res.send({ status: 'error', retcode: 1, reason: err });
                    }
                });
        },

        getduplicatevideo: function (req, res) {
            console.log("Duplicate video");
            videos.findOne({ '_id': req.query.id }, function (err, videodata) {
                // console.log("Remove data : ",videodata)
                if (err) {
                    res.json(Boom.forbidden());
                } else {
                    var data = JSON.parse(JSON.stringify(videodata));
                    delete data._id;
                    delete data.__v;
                    data.created_at = new Date();
                    data.updated_at = new Date();
                    data.status = 'created';
                    data.name = videodata.title;
                    var newvideos = new videos(data);
                    newvideos.save(function (err, data) {
                        if (err) {
                            res.send({ status: 'error', retcode: 1, reason: err });
                        } else {
                            res.send({ status: 'success', retcode: 0, id: data._id });
                        }
                    })

                }
            })
        },

        getrenderingvideo: function (req, res) {
            console.log("Rendering video");
            videos.find({ 'createdby': req.headers['userid'], $or: [{ "status": "failed" }, { "status": "waiting" }, { "status": "rendering" }, { "status": "rerendering" }] })
                .populate('createdby')
                .exec(function (err, content) {
                    if (!err) {
                        res.send({ status: 'success', retcode: 0, data: content });
                    } else {
                        res.send({ status: 'error', retcode: 1, reason: err });
                    }
                });
        },
        deletevideo: function (req, res) {
            console.log("Delete video", req.params.id);
            videos.findOne({ '_id': req.params.id }, function (err, videodata) {
                // console.log("Remove data : ",videodata)
                if (err) {
                    res.json(Boom.forbidden());
                } else {
                    videodata.remove();
                    res.json({
                        retcode: 0,
                        message: "Video deleted successfully",
                    });
                }

            })

        },

        addslide: function (req, res) {
            console.log("Add slide")
            var query = {};
            console.log(req.query.arrayindex, "arrayindex");
            var index = req.query.arrayindex

            console.log(index)

            if (req.query) {
                var data = {}
            }
            if (req.query.videoid) {
                videos.findOne({ _id: req.query.videoid })
                    .exec(function (err, content) {
                        if (!err) {
                            // console.log(content.slides,"updated slides");
                            content.slides.splice(index, 0, data);
                            console.log(content.slides, "updated slides 1");
                            videos.update({ _id: req.query.videoid }, content, function (err, count) {
                                if (!err) {
                                    res.send({ status: 'success', retcode: 0, data: count });
                                }
                                else {
                                    res.json({ status: 'failed', reason: err })
                                }
                            });
                            // res.send({ status: 'success' });
                        } else {
                            res.send({ status: 'error', retcode: 1, reason: err });
                        }
                    });
            } else {

            }
        },

        removeslide: function (req, res) {
            console.log("Remove added case doctor");
            videos.findOne({ _id: req.query.videoid }).exec(function (err, content) {
                if (!err) {
                    var slidelist = content.slides;
                    var dummylist = [];
                    for (var i = 0; i < slidelist.length; i++) {
                        if (slidelist[i]._id != req.query.slideid) {
                            dummylist.push(slidelist[i])
                        }
                    }
                    content.slides = dummylist;
                    videos.update({ '_id': req.query.videoid }, content, function (err, count) {
                        if (!err) {
                            res.send({ status: 'success', retcode: 0, casedetails: content, caseid: content._id });
                        }
                        else {
                            res.json({ status: 'failed', reason: err })
                        }
                    });
                } else {
                    console.log("error : ", err)
                    res.json(Boom.forbidden());
                }

            })

        },


        update: function (req, res) {


            var videodata = req.body;

            var update = req.body;
            update.status = "waiting";

            console.log("After update : ", update);

            var monq = require('monq');
            var client = monq(config.database.completeuri);

            videos.update({ '_id': videodata._id }, update, function (err, count) {
                if (!err) {
                    videos.find({ '_id': videodata._id }, function (err, videodata) {

                        var jobdata = {
                            videoid: videodata._id,
                            videodata: videodata[0],
                            status: 'created'
                        }

                        var newjob = new Job(jobdata);
                        newjob.save(function (err, result) {
                            if (!err && result) {
                                submitRenderJob(result._id, function () {
                                    res.send({ status: 'success', retcode: 0 });
                                });
                            } else {
                                res.send({ status: 'error', retcode: 1, reason: err });
                            }
                        });

                        // var monq = require('monq');
                        // var client = monq(config.database.completeuri);
                        // var queue = client.queue('processvideo');

                        // queue.enqueue('processfifo', videodata, function (err, job) {
                        //     console.log('enqueued:', job.data);
                        //     res.send({ status: 'success', retcode: 0 });
                        // });

                    });

                }
                else {
                    res.json({ status: 'failed', reason: err })
                }
            });
        },

        calcmusicduration: function (req, res) {
            console.log("musicupdate");
            var musicduration;
            function executeCommand(command, command_callback) {
                const { exec } = require('child_process');
                exec(command, { maxBuffer: 1024 * 500 }, function (error, stdout, stderr) {
                    console.log("error : ", error, "stdout : ", stdout, "stderr : ", stderr)
                    if (!error) {
                        console.log('cmd data', stdout)
                        command_callback("success", stdout);
                    } else {
                        console.log('cmd err', err)
                        var err = JSON.stringify(error)
                        command_callback("err", err);
                    }
                });
            }
            var finalcommand = "ffmpeg -i " + req.body.musicname + " 2>&1 | grep Duration | awk '{print $2}' | tr -d , "

            console.log(finalcommand, "final")
            executeCommand(finalcommand, function (status, duration) {
                var musicduration = convertToSeconds(duration);
                function convertToSeconds(t) {
                    var split = t.split(':');
                    var hours = parseInt(split[0]);
                    var min = parseInt(split[1]);
                    var sec = parseInt(Math.floor(split[2]));

                    return hours * 3600 + min * 60 + sec;
                }

                if (musicduration) {
                    var update = {
                        duration: musicduration
                    }
                    if (req.body.musiclib == true) {
                        console.log("music lib")
                        Musiclibrary.findOneAndUpdate({ filename: req.body.musicname }, update)
                            .exec(function (err, musicdata) {
                                if (err) {
                                    console.log(err);
                                    res.send({ status: 'error', retcode: 1, reason: err });
                                } else {
                                    res.send({ status: 'success', retcode: 0, data: musicdata });
                                }
                            });
                    } else {
                        console.log("music uploades")
                        Uploades.findOneAndUpdate({ fileurl: req.body.musicname }, update)
                            .exec(function (err, musicdata) {
                                if (err) {
                                    res.send({ status: 'error', retcode: 1, reason: err });
                                } else {
                                    res.send({ status: 'success', retcode: 0, data: musicdata });
                                }
                            });
                    }
                }
            })

        },
        calcvideoduration: function (req, res) {
            console.log("video duration find: ");
            var musicduration;
            function executeCommand(command, command_callback) {
                const { exec } = require('child_process');
                exec(command, { maxBuffer: 1024 * 500 }, function (error, stdout, stderr) {
                    console.log("error : ", error, "stdout : ", stdout, "stderr : ", stderr)
                    if (!error) {
                        console.log('cmd data', stdout)
                        command_callback("success", stdout);
                    } else {
                        var err = JSON.stringify(error)
                        console.log('cmd err', err)
                        command_callback("err", err);
                    }
                });
            }
            var finalcommand = "ffmpeg -i '" + req.body.imageURL + "' 2>&1 | grep Duration | awk '{print $2}' | tr -d , "

            console.log(finalcommand, "final")
            executeCommand(finalcommand, function (status, duration) {
                console.log(duration, status, "ressss");
                var musicduration = convertToSeconds(duration);
                function convertToSeconds(t) {
                    var split = t.split(':');
                    var hours = parseInt(split[0]);
                    var min = parseInt(split[1]);
                    var sec = parseInt(Math.floor(split[2]));

                    return hours * 3600 + min * 60 + sec;
                }
                if (musicduration) {
                    console.log(musicduration)
                    res.send({ status: 'success', retcode: 0, data: musicduration });
                } else {
                    res.send({ status: 'error', retcode: 1, reason: duration });

                }
            })

        }

    };

    router.post('/', videosroute.createvideo);
    router.get('/', videosroute.getvideo);
    router.get('/draft', videosroute.getdraft);
    router.get('/published', videosroute.getpublished);
    router.delete('/:id', videosroute.deletevideo);
    router.post('/addslide', videosroute.addslide);
    router.post('/remove', videosroute.removeslide);
    router.put('/updateVideo', videosroute.update);
    router.get('/produced', videosroute.getproducedvideo);
    router.get('/duplicate', videosroute.getduplicatevideo);
    router.get('/rendering', videosroute.getrenderingvideo);
    router.post('/musicduration', videosroute.calcmusicduration);
    router.post('/videoduration', videosroute.calcvideoduration);

    return router;
};
