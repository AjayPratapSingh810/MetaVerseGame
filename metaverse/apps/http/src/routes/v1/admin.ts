import { Router } from "express";
import {
  CreateAvatarSchema,
  CreateElementSchema,
  CreateMapSchema,
  UpdateElementSchema,
} from "../../types";
import { adminMiddleware } from "../../middleware/admin";
import client from "@repo/db/client";
export const adminRouter = Router();

adminRouter.post("/element", adminMiddleware, (req, res) => {
  const parsedData = CreateElementSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(400).json({ message: "Validation failed" });
    return;
  }

  const element = await client.element.create({
    data: {
      imageUrl: parsedData.data.imageUrl,
      width: parsedData.data.width,
      height: parsedData.data.height,
      static: parsedData.data.static,
    },
  });
  res.json({
    id: element.id,
  });
});

adminRouter.put("/element/:id", adminMiddleware, async (req, res) => {
  const parsedData = UpdateElementSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(400).json({ message: "Validation failed" });
    return;
  }
  const element = await client.element.findFirst({
    where: { id: req.params.id },
  });
  if (!element) {
    res.status(404).json({ message: "Element not found" });
    return;
  }
  await client.element.update({
    where: { id: req.params.id },
    data: {
      imageUrl: parsedData.data.imageUrl,
    },
  });
  res.json({ message: "Update element successfully" });
});

adminRouter.post("/avatar", adminMiddleware,async (req, res) => {
  const parsedData = CreateAvatarSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(400).json({ message: "Validation failed" });
    return;
  }
  const avatar = await client.avatar.create({
    data: {
      imageUrl: parsedData.data.imageUrl,
      name: parsedData.data.name,
    }
  })
  res.json({ avatarId: avatar.id });
});

adminRouter.post("/map", adminMiddleware, async(req, res) => {
  const parsedData = CreateMapSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(400).json({ message: "Validation failed" });
    return;
  }
  const map = await client.map.create({
    data: {
      name: parsedData.data.name,
      width: parseInt(parsedData.data.dimensions.split("x")[0]),
      height: parseInt(parsedData.data.dimensions.split("x")[1]),
      thumbnail: parsedData.data.thumbnail,
      mapElements: {
        create: parsedData.data.defaultElements.map(e => ({
          elementId: e.elementId,
            x: e.x,
            y: e.y
        }))
      }
    }
  })
  res.json({
    id: map.id
  })
})