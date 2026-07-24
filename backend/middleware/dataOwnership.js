import mongoose from "mongoose";

export const getOwnerId = (req) => req.appUser?.id || null;

export const isAdmin = (req) => req.appUser?.role === "admin";

export const ownerObjectId = (req) => {
  const ownerId = getOwnerId(req);
  return ownerId && mongoose.Types.ObjectId.isValid(ownerId)
    ? new mongoose.Types.ObjectId(ownerId)
    : null;
};

export const ownedFilter = (req, extra = {}) => {
  if (isAdmin(req)) {
    const requestedOwnerId = String(req.query?.ownerUserId || req.body?.ownerUserId || "").trim();
    if (mongoose.Types.ObjectId.isValid(requestedOwnerId)) {
      return {
        ...extra,
        ownerUserId: new mongoose.Types.ObjectId(requestedOwnerId),
      };
    }

    return { ...extra };
  }

  const ownerId = ownerObjectId(req);
  return ownerId ? { ...extra, ownerUserId: ownerId } : { ...extra, _id: null };
};

export const ownedCreateFields = (req) => {
  const requestedOwnerId = String(req.body?.ownerUserId || req.query?.ownerUserId || "").trim();
  if (isAdmin(req) && mongoose.Types.ObjectId.isValid(requestedOwnerId)) {
    return { ownerUserId: new mongoose.Types.ObjectId(requestedOwnerId) };
  }

  const ownerId = ownerObjectId(req);
  return ownerId ? { ownerUserId: ownerId } : {};
};

export const withOwnerOnInsert = (req, insert = {}) => ({
  ...insert,
  ...ownedCreateFields(req),
});
