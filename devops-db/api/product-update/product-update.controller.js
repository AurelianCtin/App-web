/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/things              ->  index
 * POST    /api/things              ->  create
 * GET     /api/things/:id          ->  show
 * PUT     /api/things/:id          ->  upsert
 * PATCH   /api/things/:id          ->  patch
 * DELETE  /api/things/:id          ->  destroy
 */

import { applyPatch } from 'fast-json-patch';
import { ProductUpdate } from '../../sqldb';

function respondWithResult(res, statusCode) {
    statusCode = statusCode || 200;
    return function(entity) {
        if(entity) {
            return res.status(statusCode).json(entity);
        }
        return null;
    };
}

function patchUpdates(patches) {
    return function(entity) {
        try {
            applyPatch(entity, patches, /*validate*/ true);
        } catch(err) {
            return Promise.reject(err);
        }

        return entity.save();
    };
}

function removeEntity(res) {
    return function(entity) {
        if(entity) {
            return entity.destroy()
                .then(() => res.status(204).end());
        }
    };
}

function handleEntityNotFound(res) {
    return function(entity) {
        if(!entity) {
            res.status(404).end();
            return null;
        }
        return entity;
    };
}

function handleError(res, statusCode) {
    statusCode = statusCode || 500;
    return function(err) {
        res.status(statusCode).send(err);
    };
}

// Gets a list of Things
export function index(req, res) {
    return ProductUpdate.findAll()
        .then(respondWithResult(res))
        .catch(handleError(res));
}

// Gets a single Thing from the DB
export function show(req, res) {
    return ProductUpdate.find({
        where: {
            id: req.params.id
        }
    })
        .then(handleEntityNotFound(res))
        .then(respondWithResult(res))
        .catch(handleError(res));
}

// Creates a new Thing in the DB
export function create(req, res) {
    return ProductUpdate.create(req.body)
        .then(respondWithResult(res, 201))
        .catch(handleError(res));
}

// Upserts the given Thing in the DB at the specified ID
export function upsert(req, res) {
    if (req.body.id) {
        Reflect.deleteProperty(req.body, 'id');
    }

    return ProductUpdate.findById(req.params.id).then(item => {
        if (item) {
            ProductUpdate.update(
                req.body,
                {
                    where: { id: req.params.id },
                    //logging: console.log
                }
            )
                .then(respondWithResult(res))
                .catch(handleError(res));
        } else {
            ProductUpdate.create(
                req.body,
                {
                    where: { id: req.params.id },
                    //logging: console.log
                }
            )
                .then(respondWithResult(res))
                .catch(handleError(res));
        }
    });
}
// Updates an existing Thing in the DB
export function patch(req, res) {
    if(req.body.id) {
        Reflect.deleteProperty(req.body, 'id');
    }
    return ProductUpdate.find({
        where: {
            id: req.params.id
        }
    })
        .then(handleEntityNotFound(res))
        .then(patchUpdates(req.body))
        .then(respondWithResult(res))
        .catch(handleError(res));
}

// Deletes a Thing from the DB
export function destroy(req, res) {
    return ProductUpdate.find({
        where: {
            id: req.params.id
        }
    })
        .then(handleEntityNotFound(res))
        .then(removeEntity(res))
        .catch(handleError(res));
}