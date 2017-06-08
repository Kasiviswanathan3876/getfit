const mongoose = require('mongoose');
const Profile = mongoose.model('Profile');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
    storage: multer.memoryStorage(),
    fileFilter(req, file, next) {
        const isPhoto = file.mimetype.startsWith('image/');
        if(isPhoto) {
            next(null, true);
        } else {
            next({ message: 'That filetype isn\'t allowed!' }, false);
        }
    }
};

// render page for adding profile on receiving GET
exports.addProfile = (req, res) => {
    res.render('editProfile', { title: 'Add Profile' });
};

// enable photo upload
exports.upload = multer(multerOptions).single('photo');
// work on uploaded image
exports.resize = async (req, res, next) => {
    // if no file
    if (!req.file) {
        next(); // skip
        return;
    }
    const extension = req.file.mimetype.split('/')[1];
    // rename uploaded file
    req.body.photo = `${uuid.v4()}.${extension}`;
    // resize photo
    const photo = await jimp.read(req.file.buffer);
    await photo.resize(800, jimp.AUTO);
    await photo.write(`./public/uploads/${req.body.photo}`);
    // continue
    next();
}

// add submitted profile by POST to database
exports.createProfile = async (req, res) => {
    const profile = await (new Profile(req.body)).save();
    req.flash('success', `Successfully created the profile of <strong>${profile.name}</strong>!`)
    res.redirect(`/profile/${profile.slug}`);
};

// list all profiles from database
exports.getProfiles = async (req, res) => {
    // query database for all profiles
    const profiles = await Profile.find();
    res.render('profiles', { title: 'Profiles', profiles });
};

// render page for editing profile on receiving GET
exports.editProfile = async (req, res) => {
    // find profile from given id
    const profile = await Profile.findOne({ _id: req.params.id });
    // confirm this is users profile (TODO: COMING SOON!!)

    // render edit form for profile editing
    res.render('editProfile', { title: `Edit ${profile.name}`, profile })
};

// update profile in database on receiving POST
exports.updateProfile = async (req, res) => {
    // find and update profile
    const profile = await Profile.findOneAndUpdate({ _id: req.params.id }, req.body, {
        new: true, // return new profile
        runValidators: true
    }).exec();

    req.flash('success', `Successfully updated profile of <strong>${profile.name}</strong>. <a href="/profiles/${profile.slug}">View Profile →</a>`);
    res.redirect(`/profiles/${profile._id}/edit`);
};

// individual profile page on GET at /profile/slug-here
exports.getProfileBySlug = async (req, res, next) => {
    const profile = await Profile.findOne({ slug: req.params.slug });
    if (!profile) return next();
    res.render('profile', { profile, title: profile.name });
};