import express from "express";
import Location from "../models/locationScema.js";

const locationsRouter = express.Router();


locationsRouter.get("/", async (req, res) => {
    try {
      const locations = await Location.find();
      res.json(locations);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  });
  
  locationsRouter.post("/", async (req, res) => {
    console.log(req.body);
    try {
      const { originalPayload, slugifiedPayload } = req.body;
      const name = originalPayload.name;
      const slug = slugifiedPayload.name;
  
      const existingLocation = await Location.findOne({ slug });
      if (existingLocation) {
        return res.status(400).json({ message: "duplicate" });
      }
  
      const location = new Location({
        name,
        slug, // Save the slug to the database
      });
  
      await location.save();
      res.status(201).json(location);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });
  
  locationsRouter.delete("/:id", async (req, res) => {
    const { id } = req.params;
    console.log(id);
    try {
      const location = await Location.findByIdAndDelete(req.params.id);
      if (!location) {
        return res.status(404).send({ error: "Location not found" });
      }
      res.send(location);
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: "Internal server error" });
    }
  });
  
  locationsRouter.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { originalPayload, slugifiedPayload } = req.body;
  
    try {
      // Check if the slug already exists for a different brand
      const existingLocationWithSlug = await Location.findOne({
        slug: slugifiedPayload.name,
        _id: { $ne: id }, // Exclude the current brand from the check
      });
  
      if (existingLocationWithSlug) {
        return res.status(400).json({ message: "duplicate" });
      }
  
      const location = await Location.findByIdAndUpdate(
        id,
        {
          $set: {
            name: originalPayload.name,
            slug: slugifiedPayload.name,
          },
        },
        { new: true }
      );
  
      if (!location) {
        return res.status(404).send({ error: "Location not found" });
      }
  
      res.send(location);
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: "Internal server error" });
    }
  });


export default locationsRouter;