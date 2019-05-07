// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// module dependencies
const userModel = require('../../models/v2/user');
const createError = require('../../util/error');

const getUser = async (req, res, next) => {
  try {
    const username = req.params.username;
    const userInfo = await userModel.getUser(username);
    return res.status(200).json(userInfo);
  } catch (error) {
    return next(createError.unknown(error));
  }
};

const createUserIfUserNotExist = async (req, res, next) => {
  try {
    const userData = req.userData;
    const username = userData.username;
    const userValue = {
      username: userData.username,
      email: userData.email,
      // only used for token generate.
      password: userData.oid,
      grouplist: [],
      extension: {},
    };
    await userModel.createUserIfNotExists(username, userValue);
    // const res = await userModel.createUserIfNotExists(username, userValue);
    // TODO: sync group data from group manager.
    // if (res.status === 200) {
    // }
    next();
  } catch (error) {
    return next(createError.unknown(error));
  }
};

// module exports
module.exports = {getUser, createUserIfUserNotExist};