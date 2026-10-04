/**
 * @file level.js
 * @author Eneko Tejera (enekotejera@gmail.com)
 * @brief Loads the tiled map, builds the collisions and renders the level
 * @date 2026-10-01
 *
 * @copyright Copyright (c) 2026
 *
 */
export class Level {
    constructor({mapPath = "../../Assets/Levels/Level_1.json", backgroundColor = "#72c7ed"} = {}) {
        this.mapPath = mapPath;
        this.backgroundColor = backgroundColor;

        this.width = 0;
        this.height = 0;

        this.tileWidth = 19;
        this.tileHeight = 19;

        this.platforms = [];
        this.layers = [];
        this.tilesets = [];

        this.tilesetImage = null;

        this.loaded = false;
        this.error = null;

        //the game awaits this promise before starting
        this.loadPromise = this.load();
    }

    async load() {
        try {
            const response = await fetch(this.mapPath);

            if (!response.ok)
                throw new Error(`Error loading the level: ${response.status} ${response.statusText}`);

            const map = await response.json();

            this.tileWidth = map.tilewidth || 19;
            this.tileHeight = map.tileheight || 19;

            //map size is in tiles, the level size is in pixels
            this.width = map.width * this.tileWidth;
            this.height = map.height * this.tileHeight;

            this.layers = map.layers || [];
            this.tilesets = map.tilesets || [];

            await this.loadTilesetImage();

            this.buildCollisionPlatforms();

            this.loaded = true;

            return this;
        } catch (error) {
            this.error = error;

            console.error("Error loading the level:", error);

            throw error;
        }
    }

    getObjectLayers() {
        return this.layers.filter(layer => layer.type === "objectgroup" && layer.visible !== false);
    }

    getPaintings() {
        const paintings = [];

        for (const layer of this.getObjectLayers()) {
            for (const object of layer.objects || []) {
                if (object.type !== "painting")
                    continue;

                const imageProperty = object.properties?.find(property => property.name === "image");
                const imagePath = imageProperty ? imageProperty.value : null;

                //"dialogues" is the key of the text in the language .txt,
                //the name of the object is used when it is missing
                const dialoguesProperty = object.properties?.find(property => property.name === "dialogues");

                //optional bool property in tiled, a painting is interactable unless it is set to false
                const interactableProperty = object.properties?.find(property => property.name === "interactable");

                paintings.push({
                    x: object.x,
                    y: object.y,
                    width: object.width,
                    height: object.height,
                    name: object.name,
                    text: dialoguesProperty?.value || object.name,
                    imagePath,
                    interactable: interactableProperty?.value ?? true
                });
            }
        }

        return paintings;
    }

    //reads the "npcs" object layer, custom properties in tiled:
    //images (comma separated paths), dialogues (text key) and fps (optional)
    getNPCs() {
        const npcs = [];

        for (const layer of this.getObjectLayers()) {
            if (layer.name.toLowerCase() !== "npcs")
                continue;

            for (const object of layer.objects || []) {
                const props = {};

                for (const property of object.properties || [])
                    props[property.name] = property.value;

                const width = object.width || 32;
                const height = object.height || 32;

                npcs.push({
                    x: object.x,

                    //tiled tile objects have their origin at the bottom left,
                    //rectangles at the top left
                    y: object.gid ? object.y - height : object.y,

                    width,
                    height,

                    name: object.name || "???",
                    dialogueKey: props.dialogues || object.name,

                    imagePaths: props.images
                        ? props.images.split(",").map(path => path.trim()).filter(Boolean)
                        : [],

                    fps: props.fps ?? 6
                });
            }
        }

        return npcs;
    }

    async loadTilesetImage() {
        const tileset = this.tilesets[0];

        if (!tileset || !tileset.image)
            throw new Error("Tileset could not be found");

        //the image path in the json is relative to the json itself
        const mapUrl = new URL(this.mapPath, document.baseURI);
        const imageUrl = new URL(tileset.image, mapUrl).href;

        this.tilesetImage = new Image();

        await new Promise((resolve, reject) => {
            this.tilesetImage.onload = resolve;

            this.tilesetImage.onerror = () => {
                reject(new Error(`Tileset could not be loaded: ${imageUrl}`));
            };

            this.tilesetImage.src = imageUrl;
        });
    }

    getTileLayer(name) {
        return this.layers.find(layer => layer.type === "tilelayer" && layer.name === name);
    }

    buildCollisionPlatforms() {
        this.platforms = [];

        const collisionLayer = this.getTileLayer("Collision");

        if (!collisionLayer || !collisionLayer.data) {
            console.warn("No 'Collision' layer: Please load a propper level future me");
            return;
        }

        const mapWidth = collisionLayer.width;
        const mapHeight = collisionLayer.height;
        const data = collisionLayer.data;

        //each row of solid tiles becomes a single platform,
        //this avoids creating hundreds of small rectangles
        for (let y = 0; y < mapHeight; y++) {
            let startX = null;

            //x goes one past the end so a run touching the edge is closed too
            for (let x = 0; x <= mapWidth; x++) {
                const solid = x < mapWidth && data[y * mapWidth + x] !== 0;

                if (solid && startX === null)
                    startX = x;

                if (!solid && startX !== null) {
                    this.platforms.push({
                        x: startX * this.tileWidth,
                        y: y * this.tileHeight,
                        width: (x - startX) * this.tileWidth,
                        height: this.tileHeight
                    });

                    startX = null;
                }
            }
        }
    }

    render(ctx) {
        if (!this.loaded) {
            this.renderLoading(ctx);
            return;
        }

        this.renderBackground(ctx);
        this.renderTileLayers(ctx);
    }

    renderLoading(ctx) {
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, 960, 540);

        ctx.fillStyle = "#ffffff";
        ctx.font = "20px monospace";
        ctx.fillText("Cargando nivel...", 30, 40);
    }

    renderBackground(ctx) {
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, this.width, this.height);
    }

    renderTileLayers(ctx) {
        if (!this.tilesetImage)
            return;

        const tileset = this.tilesets[0];

        const columns = tileset.columns || Math.floor(this.tilesetImage.width / this.tileWidth);
        const firstGid = tileset.firstgid || 1;

        for (const layer of this.layers) {
            //the collision layer is only used for physics, it is never drawn
            if (layer.type !== "tilelayer" || layer.visible === false || layer.name === "Collision")
                continue;

            const layerWidth = layer.width;
            const layerHeight = layer.height;
            const data = layer.data;

            for (let y = 0; y < layerHeight; y++) {
                for (let x = 0; x < layerWidth; x++) {
                    const gid = data[y * layerWidth + x];

                    //gid 0 is an empty tile
                    if (!gid)
                        continue;

                    const localId = gid - firstGid;

                    if (localId < 0)
                        continue;

                    //position of the tile inside the tileset image
                    const sourceX = (localId % columns) * this.tileWidth;
                    const sourceY = Math.floor(localId / columns) * this.tileHeight;

                    ctx.drawImage(
                        this.tilesetImage,
                        sourceX,
                        sourceY,
                        this.tileWidth,
                        this.tileHeight,
                        x * this.tileWidth,
                        y * this.tileHeight,
                        this.tileWidth,
                        this.tileHeight
                    );
                }
            }
        }
    }
}