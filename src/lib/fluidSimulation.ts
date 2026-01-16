export interface FluidConfig {
    SIM_RESOLUTION: number;
    DYE_RESOLUTION: number;
    CAPTURE_RESOLUTION: number;
    DENSITY_DISSIPATION: number;
    VELOCITY_DISSIPATION: number;
    PRESSURE: number;
    PRESSURE_ITERATIONS: number;
    CURL: number;
    SPLAT_RADIUS: number;
    SPLAT_FORCE: number;
    SHADING: boolean;
    COLORFUL: boolean;
    COLOR_UPDATE_SPEED: number;
    PAUSED: boolean;
    BACK_COLOR: { r: number; g: number; b: number };
    TRANSPARENT: boolean;
    BLOOM: boolean;
    BLOOM_ITERATIONS: number;
    BLOOM_RESOLUTION: number;
    BLOOM_INTENSITY: number;
    BLOOM_THRESHOLD: number;
    BLOOM_SOFT_KNEE: number;
    SUNRAYS: boolean;
    SUNRAYS_RESOLUTION: number;
    SUNRAYS_WEIGHT: number;
    DITHERING_TEXTURE_URL?: string;
}

export const DEFAULT_CONFIG: FluidConfig = {
    SIM_RESOLUTION: 128,
    DYE_RESOLUTION: 1024,
    CAPTURE_RESOLUTION: 512,
    DENSITY_DISSIPATION: 1,
    VELOCITY_DISSIPATION: 0.2,
    PRESSURE: 0.8,
    PRESSURE_ITERATIONS: 20,
    CURL: 30,
    SPLAT_RADIUS: 0.25,
    SPLAT_FORCE: 6000,
    SHADING: true,
    COLORFUL: true,
    COLOR_UPDATE_SPEED: 10,
    PAUSED: false,
    BACK_COLOR: { r: 0, g: 0, b: 0 },
    TRANSPARENT: false,
    BLOOM: true,
    BLOOM_ITERATIONS: 8,
    BLOOM_RESOLUTION: 256,
    BLOOM_INTENSITY: 0.8,
    BLOOM_THRESHOLD: 0.6,
    BLOOM_SOFT_KNEE: 0.7,
    SUNRAYS: true,
    SUNRAYS_RESOLUTION: 196,
    SUNRAYS_WEIGHT: 1.0,
    DITHERING_TEXTURE_URL: "/assets/LDR_LLL1_0.png"
};

export default class FluidSimulation {
    private canvas: HTMLCanvasElement;
    public config: FluidConfig;
    private gl: WebGL2RenderingContext | WebGLRenderingContext | null = null;
    private ext: any = {};
    private pointers: any[] = [];
    private splatStack: number[] = [];
    private bloomFramebuffers: any[] = [];
    private lastUpdateTime: number = Date.now();
    private colorUpdateTimer: number = 0.0;
    private animationId: number | null = null;

    // Programs
    private blurProgram: Program | null = null;
    private copyProgram: Program | null = null;
    private clearProgram: Program | null = null;
    private colorProgram: Program | null = null;
    private checkerboardProgram: Program | null = null;
    private bloomPrefilterProgram: Program | null = null;
    private bloomBlurProgram: Program | null = null;
    private bloomFinalProgram: Program | null = null;
    private sunraysMaskProgram: Program | null = null;
    private sunraysProgram: Program | null = null;
    private splatProgram: Program | null = null;
    private advectionProgram: Program | null = null;
    private divergenceProgram: Program | null = null;
    private curlProgram: Program | null = null;
    private vorticityProgram: Program | null = null;
    private pressureProgram: Program | null = null;
    private gradienSubtractProgram: Program | null = null;
    private displayMaterial: Material | null = null;

    // Framebuffers
    private dye: any;
    private velocity: any;
    private divergence: any;
    private curl: any;
    private pressure: any;
    private bloom: any;
    private sunrays: any;
    private sunraysTemp: any;
    private ditheringTexture: any;

    constructor(canvas: HTMLCanvasElement, config: Partial<FluidConfig> = {}) {
        this.canvas = canvas;
        this.config = { ...DEFAULT_CONFIG, ...config };

        this.pointers.push(new PointerPrototype());

        const { gl, ext } = this.getWebGLContext(canvas);
        this.gl = gl;
        this.ext = ext;

        if (this.isMobile()) {
            this.config.DYE_RESOLUTION = 512;
        }
        if (!ext.supportLinearFiltering) {
            this.config.DYE_RESOLUTION = 512;
            this.config.SHADING = false;
            this.config.BLOOM = false;
            this.config.SUNRAYS = false;
        }
    }

    public init() {
        if (!this.gl) return;

        this.ditheringTexture = this.createTextureAsync(this.config.DITHERING_TEXTURE_URL || "");

        // Initialize Programs
        this.initPrograms();

        // Initialize Framebuffers
        this.initFramebuffers();
        this.displayMaterial?.setKeywords(this.getKeywords());

        this.resizeCanvas();
        this.multipleSplats(parseInt((Math.random() * 20).toString()) + 5);

        this.lastUpdateTime = Date.now();
        this.update();
    }

    public destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        // WebGL cleanup logic could go here
    }

    private getKeywords() {
        let displayKeywords: string[] = [];
        if (this.config.SHADING) displayKeywords.push("SHADING");
        if (this.config.BLOOM) displayKeywords.push("BLOOM");
        if (this.config.SUNRAYS) displayKeywords.push("SUNRAYS");
        return displayKeywords;
    }

    private update = () => {
        if (!this.gl) return;

        const dt = this.calcDeltaTime();
        if (this.resizeCanvas()) {
            this.initFramebuffers();
        }
        this.updateColors(dt);
        this.applyInputs();
        if (!this.config.PAUSED) {
            this.step(dt);
        }
        this.render(null);
        this.animationId = requestAnimationFrame(this.update);
    }

    private isMobile() {
        return /Mobi|Android/i.test(navigator.userAgent);
    }

    private getWebGLContext(canvas: HTMLCanvasElement) {
        const params = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };
        let gl = canvas.getContext('webgl2', params);
        const isWebGL2 = !!gl;
        if (!isWebGL2)
            gl = (canvas.getContext('webgl', params) || canvas.getContext('experimental-webgl', params)) as any;

        let halfFloat;
        let supportLinearFiltering;
        if (isWebGL2) {
            gl.getExtension('EXT_color_buffer_float');
            supportLinearFiltering = gl.getExtension('OES_texture_float_linear');
        } else {
            halfFloat = gl.getExtension('OES_texture_half_float');
            supportLinearFiltering = gl.getExtension('OES_texture_half_float_linear');
        }

        gl.clearColor(0.0, 0.0, 0.0, 1.0);

        const halfFloatTexType = isWebGL2 ? gl.HALF_FLOAT : halfFloat.HALF_FLOAT_OES;
        let formatRGBA;
        let formatRG;
        let formatR;

        if (isWebGL2) {
            formatRGBA = this.getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType);
            formatRG = this.getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
            formatR = this.getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);
        } else {
            formatRGBA = this.getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
            formatRG = this.getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
            formatR = this.getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
        }

        return {
            gl,
            ext: {
                formatRGBA,
                formatRG,
                formatR,
                halfFloatTexType,
                supportLinearFiltering
            }
        };
    }

    private getSupportedFormat(gl: any, internalFormat: any, format: any, type: any): any {
        if (!this.supportRenderTextureFormat(gl, internalFormat, format, type)) {
            switch (internalFormat) {
                case gl.R16F:
                    return this.getSupportedFormat(gl, gl.RG16F, gl.RG, type);
                case gl.RG16F:
                    return this.getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
                default:
                    return null;
            }
        }

        return {
            internalFormat,
            format
        }
    }

    private supportRenderTextureFormat(gl: any, internalFormat: any, format: any, type: any): any {
        let texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);

        let fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        return status == gl.FRAMEBUFFER_COMPLETE;
    }

    private getResolution(resolution: number) {
        if (!this.gl) return { width: 0, height: 0 };
        let aspectRatio = this.gl.drawingBufferWidth / this.gl.drawingBufferHeight;
        if (aspectRatio < 1)
            aspectRatio = 1.0 / aspectRatio;

        let min = Math.round(resolution);
        let max = Math.round(resolution * aspectRatio);

        if (this.gl.drawingBufferWidth > this.gl.drawingBufferHeight)
            return { width: max, height: min };
        else
            return { width: min, height: max };
    }

    private getTextureScale(texture: any, width: number, height: number) {
        return {
            x: width / texture.width,
            y: height / texture.height
        };
    }
    private blit = (target: any, clear = false) => {
        if (!this.gl) return;

        if (target == null) {
            this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        } else {
            this.gl.viewport(0, 0, target.width, target.height);
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, target.fbo);
        }

        if (clear) {
            this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        }

        if (!this.ext.blitVBO) {
            const gl = this.gl;
            gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
            gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(0);
            this.ext.blitVBO = true; // Optimization: do this once ideally, but for now safe enough
        }

        // Assuming VBO set up from previous calls or init - simplified for this context:
        // In the original, it was an IIFE that closed over the VBO setup. 
        // We really should strictly set up VBO once.
        // Let's rely on init doing it or checking if it's bound.
        // For robustness, let's just drawElements as the pointers are likely still valid or re-bound in a real engine
        // But here we might need to be careful.
        // Let's rewrite blit to be safe re-binding or cached.

        // Actually, let's fix the VBO logic proper.
        this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
    }

    private calcDeltaTime() {
        let now = Date.now();
        let dt = (now - this.lastUpdateTime) / 1000;
        dt = Math.min(dt, 0.016666);
        this.lastUpdateTime = now;
        return dt;
    }

    private resizeCanvas() {
        if (!this.canvas || !this.gl) return false;
        let width = this.scaleByPixelRatio(this.canvas.clientWidth);
        let height = this.scaleByPixelRatio(this.canvas.clientHeight);
        if (this.canvas.width != width || this.canvas.height != height) {
            this.canvas.width = width;
            this.canvas.height = height;
            return true;
        }
        return false;
    }

    private updateColors(dt: number) {
        if (!this.config.COLORFUL) return;

        this.colorUpdateTimer += dt * this.config.COLOR_UPDATE_SPEED;
        if (this.colorUpdateTimer >= 1) {
            this.colorUpdateTimer = this.wrap(this.colorUpdateTimer, 0, 1);
            this.pointers.forEach(p => {
                p.color = this.generateColor();
            });
        }
    }

    private applyInputs() {
        if (this.splatStack.length > 0)
            this.multipleSplats(this.splatStack.pop()!);

        this.pointers.forEach(p => {
            if (p.moved) {
                p.moved = false;
                this.splatPointer(p);
            }
        });
    }

    private step(dt: number) {
        if (!this.gl) return;
        this.gl.disable(this.gl.BLEND);

        this.curlProgram!.bind();
        this.gl.uniform2f(this.curlProgram!.uniforms.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY);
        this.gl.uniform1i(this.curlProgram!.uniforms.uVelocity, this.velocity.read.attach(0));
        this.blit(this.curl);

        this.vorticityProgram!.bind();
        this.gl.uniform2f(this.vorticityProgram!.uniforms.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY);
        this.gl.uniform1i(this.vorticityProgram!.uniforms.uVelocity, this.velocity.read.attach(0));
        this.gl.uniform1i(this.vorticityProgram!.uniforms.uCurl, this.curl.attach(1));
        this.gl.uniform1f(this.vorticityProgram!.uniforms.curl, this.config.CURL);
        this.gl.uniform1f(this.vorticityProgram!.uniforms.dt, dt);
        this.blit(this.velocity.write);
        this.velocity.swap();

        this.divergenceProgram!.bind();
        this.gl.uniform2f(this.divergenceProgram!.uniforms.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY);
        this.gl.uniform1i(this.divergenceProgram!.uniforms.uVelocity, this.velocity.read.attach(0));
        this.blit(this.divergence);

        this.clearProgram!.bind();
        this.gl.uniform1i(this.clearProgram!.uniforms.uTexture, this.pressure.read.attach(0));
        this.gl.uniform1f(this.clearProgram!.uniforms.value, this.config.PRESSURE);
        this.blit(this.pressure.write);
        this.pressure.swap();

        this.pressureProgram!.bind();
        this.gl.uniform2f(this.pressureProgram!.uniforms.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY);
        this.gl.uniform1i(this.pressureProgram!.uniforms.uDivergence, this.divergence.attach(0));
        for (let i = 0; i < this.config.PRESSURE_ITERATIONS; i++) {
            this.gl.uniform1i(this.pressureProgram!.uniforms.uPressure, this.pressure.read.attach(1));
            this.blit(this.pressure.write);
            this.pressure.swap();
        }

        this.gradienSubtractProgram!.bind();
        this.gl.uniform2f(this.gradienSubtractProgram!.uniforms.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY);
        this.gl.uniform1i(this.gradienSubtractProgram!.uniforms.uPressure, this.pressure.read.attach(0));
        this.gl.uniform1i(this.gradienSubtractProgram!.uniforms.uVelocity, this.velocity.read.attach(1));
        this.blit(this.velocity.write);
        this.velocity.swap();

        this.advectionProgram!.bind();
        this.gl.uniform2f(this.advectionProgram!.uniforms.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY);
        if (!this.ext.supportLinearFiltering)
            this.gl.uniform2f(this.advectionProgram!.uniforms.dyeTexelSize, this.velocity.texelSizeX, this.velocity.texelSizeY);
        let velocityId = this.velocity.read.attach(0);
        this.gl.uniform1i(this.advectionProgram!.uniforms.uVelocity, velocityId);
        this.gl.uniform1i(this.advectionProgram!.uniforms.uSource, velocityId);
        this.gl.uniform1f(this.advectionProgram!.uniforms.dt, dt);
        this.gl.uniform1f(this.advectionProgram!.uniforms.dissipation, this.config.VELOCITY_DISSIPATION);
        this.blit(this.velocity.write);
        this.velocity.swap();

        if (!this.ext.supportLinearFiltering)
            this.gl.uniform2f(this.advectionProgram!.uniforms.dyeTexelSize, this.dye.texelSizeX, this.dye.texelSizeY);
        this.gl.uniform1i(this.advectionProgram!.uniforms.uVelocity, this.velocity.read.attach(0));
        this.gl.uniform1i(this.advectionProgram!.uniforms.uSource, this.dye.read.attach(1));
        this.gl.uniform1f(this.advectionProgram!.uniforms.dissipation, this.config.DENSITY_DISSIPATION);
        this.blit(this.dye.write);
        this.dye.swap();
    }

    private render(target: any) {
        if (!this.gl) return;
        if (this.config.BLOOM)
            this.applyBloom(this.dye.read, this.bloom);
        if (this.config.SUNRAYS) {
            this.applySunrays(this.dye.read, this.dye.write, this.sunrays);
            this.blur(this.sunrays, this.sunraysTemp, 1);
        }

        if (target == null || !this.config.TRANSPARENT) {
            this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
            this.gl.enable(this.gl.BLEND);
        } else {
            this.gl.disable(this.gl.BLEND);
        }

        if (!this.config.TRANSPARENT)
            this.drawColor(target, this.normalizeColor(this.config.BACK_COLOR));
        // if (target == null && this.config.TRANSPARENT)
        //     this.drawCheckerboard(target);
        this.drawDisplay(target);
    }

    private drawColor(target: any, color: any) {
        this.colorProgram!.bind();
        this.gl!.uniform4f(this.colorProgram!.uniforms.color, color.r, color.g, color.b, 1);
        this.blit(target);
    }

    private drawCheckerboard(target: any) {
        this.checkerboardProgram!.bind();
        this.gl!.uniform1f(this.checkerboardProgram!.uniforms.aspectRatio, this.canvas.width / this.canvas.height);
        this.blit(target);
    }

    private drawDisplay(target: any) {
        let width = target == null ? this.gl!.drawingBufferWidth : target.width;
        let height = target == null ? this.gl!.drawingBufferHeight : target.height;

        this.displayMaterial!.bind();
        if (this.config.SHADING)
            this.gl!.uniform2f(this.displayMaterial!.uniforms.texelSize, 1.0 / width, 1.0 / height);
        this.gl!.uniform1i(this.displayMaterial!.uniforms.uTexture, this.dye.read.attach(0));
        if (this.config.BLOOM) {
            this.gl!.uniform1i(this.displayMaterial!.uniforms.uBloom, this.bloom.attach(1));
            this.gl!.uniform1i(this.displayMaterial!.uniforms.uDithering, this.ditheringTexture.attach(2));
            let scale = this.getTextureScale(this.ditheringTexture, width, height);
            this.gl!.uniform2f(this.displayMaterial!.uniforms.ditherScale, scale.x, scale.y);
        }
        if (this.config.SUNRAYS)
            this.gl!.uniform1i(this.displayMaterial!.uniforms.uSunrays, this.sunrays.attach(3));
        this.blit(target);
    }

    private applyBloom(source: any, destination: any) {
        if (this.bloomFramebuffers.length < 2) return;

        let last = destination;

        this.gl!.disable(this.gl!.BLEND);
        this.bloomPrefilterProgram!.bind();
        let knee = this.config.BLOOM_THRESHOLD * this.config.BLOOM_SOFT_KNEE + 0.0001;
        let curve0 = this.config.BLOOM_THRESHOLD - knee;
        let curve1 = knee * 2;
        let curve2 = 0.25 / knee;
        this.gl!.uniform3f(this.bloomPrefilterProgram!.uniforms.curve, curve0, curve1, curve2);
        this.gl!.uniform1f(this.bloomPrefilterProgram!.uniforms.threshold, this.config.BLOOM_THRESHOLD);
        this.gl!.uniform1i(this.bloomPrefilterProgram!.uniforms.uTexture, source.attach(0));
        this.blit(last);

        this.bloomBlurProgram!.bind();
        for (let i = 0; i < this.bloomFramebuffers.length; i++) {
            let dest = this.bloomFramebuffers[i];
            this.gl!.uniform2f(this.bloomBlurProgram!.uniforms.texelSize, last.texelSizeX, last.texelSizeY);
            this.gl!.uniform1i(this.bloomBlurProgram!.uniforms.uTexture, last.attach(0));
            this.blit(dest);
            last = dest;
        }

        this.gl!.blendFunc(this.gl!.ONE, this.gl!.ONE);
        this.gl!.enable(this.gl!.BLEND);

        for (let i = this.bloomFramebuffers.length - 2; i >= 0; i--) {
            let baseTex = this.bloomFramebuffers[i];
            this.gl!.uniform2f(this.bloomBlurProgram!.uniforms.texelSize, last.texelSizeX, last.texelSizeY);
            this.gl!.uniform1i(this.bloomBlurProgram!.uniforms.uTexture, last.attach(0));
            this.gl!.viewport(0, 0, baseTex.width, baseTex.height);
            this.blit(baseTex);
            last = baseTex;
        }

        this.gl!.disable(this.gl!.BLEND);
        this.bloomFinalProgram!.bind();
        this.gl!.uniform2f(this.bloomFinalProgram!.uniforms.texelSize, last.texelSizeX, last.texelSizeY);
        this.gl!.uniform1i(this.bloomFinalProgram!.uniforms.uTexture, last.attach(0));
        this.gl!.uniform1f(this.bloomFinalProgram!.uniforms.intensity, this.config.BLOOM_INTENSITY);
        this.blit(destination);
    }

    private applySunrays(source: any, mask: any, destination: any) {
        this.gl!.disable(this.gl!.BLEND);
        this.sunraysMaskProgram!.bind();
        this.gl!.uniform1i(this.sunraysMaskProgram!.uniforms.uTexture, source.attach(0));
        this.blit(mask);

        this.sunraysProgram!.bind();
        this.gl!.uniform1f(this.sunraysProgram!.uniforms.weight, this.config.SUNRAYS_WEIGHT);
        this.gl!.uniform1i(this.sunraysProgram!.uniforms.uTexture, mask.attach(0));
        this.blit(destination);
    }

    private blur(target: any, temp: any, iterations: number) {
        this.blurProgram!.bind();
        for (let i = 0; i < iterations; i++) {
            this.gl!.uniform2f(this.blurProgram!.uniforms.texelSize, target.texelSizeX, 0.0);
            this.gl!.uniform1i(this.blurProgram!.uniforms.uTexture, target.attach(0));
            this.blit(temp);

            this.gl!.uniform2f(this.blurProgram!.uniforms.texelSize, 0.0, target.texelSizeY);
            this.gl!.uniform1i(this.blurProgram!.uniforms.uTexture, temp.attach(0));
            this.blit(target);
        }
    }

    private splatPointer(pointer: any) {
        let dx = pointer.deltaX * this.config.SPLAT_FORCE;
        let dy = pointer.deltaY * this.config.SPLAT_FORCE;
        this.splat(pointer.texcoordX, pointer.texcoordY, dx, dy, pointer.color);
    }

    public multipleSplats(amount: number) {
        for (let i = 0; i < amount; i++) {
            const color = this.generateColor();
            color.r *= 10.0;
            color.g *= 10.0;
            color.b *= 10.0;
            const x = Math.random();
            const y = Math.random();
            const dx = 1000 * (Math.random() - 0.5);
            const dy = 1000 * (Math.random() - 0.5);
            this.splat(x, y, dx, dy, color);
        }
    }

    public splat(x: number, y: number, dx: number, dy: number, color: any) {
        if (!this.gl) return;
        this.splatProgram!.bind();
        this.gl.uniform1i(this.splatProgram!.uniforms.uTarget, this.velocity.read.attach(0));
        this.gl.uniform1f(this.splatProgram!.uniforms.aspectRatio, this.canvas.width / this.canvas.height);
        this.gl.uniform2f(this.splatProgram!.uniforms.point, x, y);
        this.gl.uniform3f(this.splatProgram!.uniforms.color, dx, dy, 0.0);
        this.gl.uniform1f(this.splatProgram!.uniforms.radius, this.correctRadius(this.config.SPLAT_RADIUS / 100.0));
        this.blit(this.velocity.write);
        this.velocity.swap();

        this.gl.uniform1i(this.splatProgram!.uniforms.uTarget, this.dye.read.attach(0));
        this.gl.uniform3f(this.splatProgram!.uniforms.color, color.r, color.g, color.b);
        this.blit(this.dye.write);
        this.dye.swap();
    }

    private correctRadius(radius: number) {
        let aspectRatio = this.canvas.width / this.canvas.height;
        if (aspectRatio > 1)
            radius *= aspectRatio;
        return radius;
    }

    private scaleByPixelRatio(input: number) {
        let pixelRatio = window.devicePixelRatio || 1;
        return Math.floor(input * pixelRatio);
    }

    private wrap(value: number, min: number, max: number) {
        let range = max - min;
        if (range == 0) return min;
        return (value - min) % range + min;
    }

    private generateColor() {
        let c = this.HSVtoRGB(Math.random(), 1.0, 1.0);
        c.r *= 0.15;
        c.g *= 0.15;
        c.b *= 0.15;
        return c;
    }

    private HSVtoRGB(h: number, s: number, v: number) {
        let r, g, b, i, f, p, q, t;
        i = Math.floor(h * 6);
        f = h * 6 - i;
        p = v * (1 - s);
        q = v * (1 - f * s);
        t = v * (1 - (1 - f) * s);

        switch (i % 6) {
            case 0: r = v, g = t, b = p; break;
            case 1: r = q, g = v, b = p; break;
            case 2: r = p, g = v, b = t; break;
            case 3: r = p, g = q, b = v; break;
            case 4: r = t, g = p, b = v; break;
            case 5: r = v, g = p, b = q; break;
            case 6: r = v, g = p, b = q; break; // Should not happen with mod 6 but type safety
            default: r = 0; g = 0; b = 0; break;
        }

        return {
            r: r || 0,
            g: g || 0,
            b: b || 0
        };
    }

    private normalizeColor(input: any) {
        return {
            r: input.r / 255,
            g: input.g / 255,
            b: input.b / 255
        };
    }

    public handlePointerDown(id: number, x: number, y: number) {
        let posX = this.scaleByPixelRatio(x);
        let posY = this.scaleByPixelRatio(y);
        let pointer = this.pointers.find(p => p.id == id);
        if (pointer == null) pointer = new PointerPrototype();

        pointer.id = id;
        pointer.down = true;
        pointer.moved = false;
        pointer.texcoordX = posX / this.canvas.width;
        pointer.texcoordY = 1.0 - posY / this.canvas.height;
        pointer.prevTexcoordX = pointer.texcoordX;
        pointer.prevTexcoordY = pointer.texcoordY;
        pointer.deltaX = 0;
        pointer.deltaY = 0;
        pointer.color = this.generateColor();

        if (!this.pointers.find(p => p.id === id)) {
            this.pointers.push(pointer);
        }
    }

    public handlePointerMove(id: number, x: number, y: number) {
        let pointer = this.pointers.find(p => p.id == id);
        if (!pointer || !pointer.down) return;

        let posX = this.scaleByPixelRatio(x);
        let posY = this.scaleByPixelRatio(y);

        pointer.prevTexcoordX = pointer.texcoordX;
        pointer.prevTexcoordY = pointer.texcoordY;
        pointer.texcoordX = posX / this.canvas.width;
        pointer.texcoordY = 1.0 - posY / this.canvas.height;
        pointer.deltaX = this.correctDeltaX(pointer.texcoordX - pointer.prevTexcoordX);
        pointer.deltaY = this.correctDeltaY(pointer.texcoordY - pointer.prevTexcoordY);
        pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
    }

    public handlePointerUp(id: number) {
        let pointer = this.pointers.find(p => p.id == id);
        if (pointer) pointer.down = false;
    }

    private correctDeltaX(delta: number) {
        let aspectRatio = this.canvas.width / this.canvas.height;
        if (aspectRatio < 1) delta *= aspectRatio;
        return delta;
    }

    private correctDeltaY(delta: number) {
        let aspectRatio = this.canvas.width / this.canvas.height;
        if (aspectRatio > 1) delta /= aspectRatio;
        return delta;
    }
    private initPrograms() {
        if (!this.gl) return;

        this.blurProgram = new Program(this.gl, blurVertexShader, blurShader);
        this.copyProgram = new Program(this.gl, baseVertexShader, copyShader);
        this.clearProgram = new Program(this.gl, baseVertexShader, clearShader);
        this.colorProgram = new Program(this.gl, baseVertexShader, colorShader);
        this.checkerboardProgram = new Program(this.gl, baseVertexShader, checkerboardShader);
        this.bloomPrefilterProgram = new Program(this.gl, baseVertexShader, bloomPrefilterShader);
        this.bloomBlurProgram = new Program(this.gl, baseVertexShader, bloomBlurShader);
        this.bloomFinalProgram = new Program(this.gl, baseVertexShader, bloomFinalShader);
        this.sunraysMaskProgram = new Program(this.gl, baseVertexShader, sunraysMaskShader);
        this.sunraysProgram = new Program(this.gl, baseVertexShader, sunraysShader);
        this.splatProgram = new Program(this.gl, baseVertexShader, splatShader);
        this.advectionProgram = new Program(this.gl, baseVertexShader, advectionShader);
        this.divergenceProgram = new Program(this.gl, baseVertexShader, divergenceShader);
        this.curlProgram = new Program(this.gl, baseVertexShader, curlShader);
        this.vorticityProgram = new Program(this.gl, baseVertexShader, vorticityShader);
        this.pressureProgram = new Program(this.gl, baseVertexShader, pressureShader);
        this.gradienSubtractProgram = new Program(this.gl, baseVertexShader, gradientSubtractShader);

        this.displayMaterial = new Material(this.gl, baseVertexShader, displayShaderSource, this.config);
    }

    private initFramebuffers() {
        if (!this.gl) return;

        let simRes = this.getResolution(this.config.SIM_RESOLUTION);
        let dyeRes = this.getResolution(this.config.DYE_RESOLUTION);

        const texType = this.ext.halfFloatTexType;
        const rgba = this.ext.formatRGBA;
        const rg = this.ext.formatRG;
        const r = this.ext.formatR;
        const filtering = this.ext.supportLinearFiltering ? this.gl.LINEAR : this.gl.NEAREST;

        this.gl.disable(this.gl.BLEND);

        if (!this.dye)
            this.dye = this.createDoubleFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
        else
            this.dye = this.resizeDoubleFBO(this.dye, dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);

        if (!this.velocity)
            this.velocity = this.createDoubleFBO(simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
        else
            this.velocity = this.resizeDoubleFBO(this.velocity, simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);

        this.divergence = this.createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, this.gl.NEAREST);
        this.curl = this.createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, this.gl.NEAREST);
        this.pressure = this.createDoubleFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, this.gl.NEAREST);

        this.initBloomFramebuffers();
        this.initSunraysFramebuffers();
    }

    private initBloomFramebuffers() {
        if (!this.gl) return;
        let res = this.getResolution(this.config.BLOOM_RESOLUTION);

        const texType = this.ext.halfFloatTexType;
        const rgba = this.ext.formatRGBA;
        const filtering = this.ext.supportLinearFiltering ? this.gl.LINEAR : this.gl.NEAREST;

        this.bloom = this.createFBO(res.width, res.height, rgba.internalFormat, rgba.format, texType, filtering);

        this.bloomFramebuffers.length = 0;
        for (let i = 0; i < this.config.BLOOM_ITERATIONS; i++) {
            let width = res.width >> (i + 1);
            let height = res.height >> (i + 1);

            if (width < 2 || height < 2) break;

            let fbo = this.createFBO(width, height, rgba.internalFormat, rgba.format, texType, filtering);
            this.bloomFramebuffers.push(fbo);
        }
    }

    private initSunraysFramebuffers() {
        if (!this.gl) return;
        let res = this.getResolution(this.config.SUNRAYS_RESOLUTION);

        const texType = this.ext.halfFloatTexType;
        const r = this.ext.formatR;
        const filtering = this.ext.supportLinearFiltering ? this.gl.LINEAR : this.gl.NEAREST;

        this.sunrays = this.createFBO(res.width, res.height, r.internalFormat, r.format, texType, filtering);
        this.sunraysTemp = this.createFBO(res.width, res.height, r.internalFormat, r.format, texType, filtering);
    }

    private createFBO(w: number, h: number, internalFormat: any, format: any, type: any, param: any) {
        if (!this.gl) throw new Error("WebGL not initialized");

        this.gl.activeTexture(this.gl.TEXTURE0);
        let texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, param);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, param);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

        let fbo = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, texture, 0);
        this.gl.viewport(0, 0, w, h);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        let texelSizeX = 1.0 / w;
        let texelSizeY = 1.0 / h;

        return {
            texture,
            fbo,
            width: w,
            height: h,
            texelSizeX,
            texelSizeY,
            attach: (id: number) => {
                if (!this.gl) return id;
                this.gl.activeTexture(this.gl.TEXTURE0 + id);
                this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
                return id;
            }
        };
    }

    private createDoubleFBO(w: number, h: number, internalFormat: any, format: any, type: any, param: any) {
        let fbo1 = this.createFBO(w, h, internalFormat, format, type, param);
        let fbo2 = this.createFBO(w, h, internalFormat, format, type, param);

        const obj = {
            width: w,
            height: h,
            texelSizeX: fbo1.texelSizeX,
            texelSizeY: fbo1.texelSizeY,
            get read() { return fbo1; },
            set read(value) { fbo1 = value; },
            get write() { return fbo2; },
            set write(value) { fbo2 = value; },
            swap: () => {
                let temp = fbo1;
                fbo1 = fbo2;
                fbo2 = temp;
            }
        };
        return obj;
    }

    private resizeFBO(target: any, w: number, h: number, internalFormat: any, format: any, type: any, param: any) {
        let newFBO = this.createFBO(w, h, internalFormat, format, type, param);
        this.copyProgram!.bind();
        this.gl!.uniform1i(this.copyProgram!.uniforms.uTexture, target.attach(0));
        this.blit(newFBO);
        return newFBO;
    }

    private resizeDoubleFBO(target: any, w: number, h: number, internalFormat: any, format: any, type: any, param: any) {
        if (target.width == w && target.height == h)
            return target;
        target.read = this.resizeFBO(target.read, w, h, internalFormat, format, type, param);
        target.write = this.createFBO(w, h, internalFormat, format, type, param);
        target.width = w;
        target.height = h;
        target.texelSizeX = 1.0 / w;
        target.texelSizeY = 1.0 / h;
        return target;
    }

    private createTextureAsync(url: string) {
        if (!this.gl) return;
        let texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGB, 1, 1, 0, this.gl.RGB, this.gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255]));

        let obj = {
            texture,
            width: 1,
            height: 1,
            attach: (id: number) => {
                if (!this.gl) return id;
                this.gl.activeTexture(this.gl.TEXTURE0 + id);
                this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
                return id;
            }
        };

        let image = new Image();
        image.onload = () => {
            if (!this.gl) return;
            obj.width = image.width;
            obj.height = image.height;
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGB, this.gl.RGB, this.gl.UNSIGNED_BYTE, image);
        };
        image.src = url;

        return obj;
    }
}

class PointerPrototype {
    id = -1;
    texcoordX = 0;
    texcoordY = 0;
    prevTexcoordX = 0;
    prevTexcoordY = 0;
    deltaX = 0;
    deltaY = 0;
    down = false;
    moved = false;
    color = [30, 0, 300];
}

class Material {
    vertexShader: WebGLShader;
    fragmentShaderSource: string;
    programs: any[] = [];
    activeProgram: any = null;
    uniforms: any = [];
    gl: WebGLRenderingContext | WebGL2RenderingContext;
    config: FluidConfig;

    constructor(gl: WebGLRenderingContext | WebGL2RenderingContext, vertexShader: string, fragmentShaderSource: string, config: FluidConfig) {
        this.gl = gl;
        this.vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShader);
        this.fragmentShaderSource = fragmentShaderSource;
        this.config = config;
    }

    setKeywords(keywords: string[]) {
        let hash = 0;
        for (let i = 0; i < keywords.length; i++)
            hash += this.hashCode(keywords[i]);

        let program = this.programs[hash];
        if (program == null) {
            let fragmentShader = compileShader(this.gl, this.gl.FRAGMENT_SHADER, this.fragmentShaderSource, keywords);
            program = createProgram(this.gl, this.vertexShader, fragmentShader);
            this.programs[hash] = program;
        }

        if (program == this.activeProgram) return;

        this.uniforms = getUniforms(this.gl, program);
        this.activeProgram = program;
    }

    bind() {
        this.gl.useProgram(this.activeProgram);
    }

    hashCode(s: string) {
        if (s.length == 0) return 0;
        let hash = 0;
        for (let i = 0; i < s.length; i++) {
            hash = (hash << 5) - hash + s.charCodeAt(i);
            hash |= 0;
        }
        return hash;
    };
}

class Program {
    uniforms: any = {};
    program: any;
    gl: WebGL2RenderingContext | WebGLRenderingContext;

    constructor(gl: WebGL2RenderingContext | WebGLRenderingContext, vertexShaderSource: string, fragmentShaderSource: string) {
        this.gl = gl;
        this.uniforms = {};
        const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
        this.program = createProgram(gl, vertexShader, fragmentShader);
        this.uniforms = getUniforms(gl, this.program);
    }

    bind() {
        this.gl.useProgram(this.program);
    }
}

function createProgram(gl: any, vertexShader: any, fragmentShader: any) {
    let program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        console.trace(gl.getProgramInfoLog(program));

    return program;
}

function getUniforms(gl: any, program: any) {
    let uniforms: any = {};
    let uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < uniformCount; i++) {
        let uniformName = gl.getActiveUniform(program, i).name;
        uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
    }
    return uniforms;
}

function compileShader(gl: any, type: any, source: any, keywords?: any) {
    source = addKeywords(source, keywords);

    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        console.trace(gl.getShaderInfoLog(shader));

    return shader;
};

function addKeywords(source: string, keywords: any) {
    if (keywords == null) return source;
    let keywordsString = '';
    keywords.forEach((keyword: any) => {
        keywordsString += '#define ' + keyword + '\\n';
    });
    return keywordsString + source;
}

const baseVertexShader = `
    precision highp float;

    attribute vec2 aPosition;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform vec2 texelSize;

    void main () {
        vUv = aPosition * 0.5 + 0.5;
        vL = vUv - vec2(texelSize.x, 0.0);
        vR = vUv + vec2(texelSize.x, 0.0);
        vT = vUv + vec2(0.0, texelSize.y);
        vB = vUv - vec2(0.0, texelSize.y);
        gl_Position = vec4(aPosition, 0.0, 1.0);
    }
`;

const blurVertexShader = `
    precision highp float;

    attribute vec2 aPosition;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    uniform vec2 texelSize;

    void main () {
        vUv = aPosition * 0.5 + 0.5;
        float offset = 1.33333333;
        vL = vUv - texelSize * offset;
        vR = vUv + texelSize * offset;
        gl_Position = vec4(aPosition, 0.0, 1.0);
    }
`;

const blurShader = `
    precision mediump float;
    precision mediump sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    uniform sampler2D uTexture;

    void main () {
        vec4 sum = texture2D(uTexture, vUv) * 0.29411764;
        sum += texture2D(uTexture, vL) * 0.35294117;
        sum += texture2D(uTexture, vR) * 0.35294117;
        gl_FragColor = sum;
    }
`;

const copyShader = `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    uniform sampler2D uTexture;

    void main () {
        gl_FragColor = texture2D(uTexture, vUv);
    }
`;

const clearShader = `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    uniform sampler2D uTexture;
    uniform float value;

    void main () {
        gl_FragColor = value * texture2D(uTexture, vUv);
    }
`;

const colorShader = `
    precision mediump float;

    uniform vec4 color;

    void main () {
        gl_FragColor = color;
    }
`;

const checkerboardShader = `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    uniform sampler2D uTexture;
    uniform float aspectRatio;

    #define SCALE 25.0

    void main () {
        vec2 uv = floor(vUv * SCALE * vec2(aspectRatio, 1.0));
        float v = mod(uv.x + uv.y, 2.0);
        v = v * 0.1 + 0.8;
        gl_FragColor = vec4(vec3(v), 1.0);
    }
`;

const displayShaderSource = `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uTexture;
    uniform sampler2D uBloom;
    uniform sampler2D uSunrays;
    uniform sampler2D uDithering;
    uniform vec2 ditherScale;
    uniform vec2 texelSize;

    vec3 linearToGamma (vec3 color) {
        color = max(color, vec3(0));
        return max(1.055 * pow(color, vec3(0.416666667)) - 0.055, vec3(0));
    }

    void main () {
        vec3 c = texture2D(uTexture, vUv).rgb;

    #ifdef SHADING
        vec3 lc = texture2D(uTexture, vL).rgb;
        vec3 rc = texture2D(uTexture, vR).rgb;
        vec3 tc = texture2D(uTexture, vT).rgb;
        vec3 bc = texture2D(uTexture, vB).rgb;

        float dx = length(rc) - length(lc);
        float dy = length(tc) - length(bc);

        vec3 n = normalize(vec3(dx, dy, length(texelSize)));
        vec3 l = vec3(0.0, 0.0, 1.0);

        float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
        c *= diffuse;
    #endif

    #ifdef BLOOM
        vec3 bloom = texture2D(uBloom, vUv).rgb;
    #endif

    #ifdef SUNRAYS
        float sunrays = texture2D(uSunrays, vUv).r;
        c *= sunrays;
    #ifdef BLOOM
        bloom *= sunrays;
    #endif
    #endif

    #ifdef BLOOM
        float noise = texture2D(uDithering, vUv * ditherScale).r;
        noise = noise * 2.0 - 1.0;
        bloom += noise / 255.0;
        bloom = linearToGamma(bloom);
        c += bloom;
    #endif

        float a = max(c.r, max(c.g, c.b));
        gl_FragColor = vec4(c, a);
    }
`;

const bloomPrefilterShader = `
    precision mediump float;
    precision mediump sampler2D;

    varying vec2 vUv;
    uniform sampler2D uTexture;
    uniform vec3 curve;
    uniform float threshold;

    void main () {
        vec3 c = texture2D(uTexture, vUv).rgb;
        float br = max(c.r, max(c.g, c.b));
        float rq = clamp(br - curve.x, 0.0, curve.y);
        rq = curve.z * rq * rq;
        c *= max(rq, br - threshold) / max(br, 0.0001);
        gl_FragColor = vec4(c, 0.0);
    }
`;

const bloomBlurShader = `
    precision mediump float;
    precision mediump sampler2D;

    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uTexture;

    void main () {
        vec4 sum = vec4(0.0);
        sum += texture2D(uTexture, vL);
        sum += texture2D(uTexture, vR);
        sum += texture2D(uTexture, vT);
        sum += texture2D(uTexture, vB);
        sum *= 0.25;
        gl_FragColor = sum;
    }
`;

const bloomFinalShader = `
    precision mediump float;
    precision mediump sampler2D;

    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uTexture;
    uniform float intensity;

    void main () {
        vec4 sum = vec4(0.0);
        sum += texture2D(uTexture, vL);
        sum += texture2D(uTexture, vR);
        sum += texture2D(uTexture, vT);
        sum += texture2D(uTexture, vB);
        sum *= 0.25;
        gl_FragColor = sum * intensity;
    }
`;

const sunraysMaskShader = `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    uniform sampler2D uTexture;

    void main () {
        vec4 c = texture2D(uTexture, vUv);
        float br = max(c.r, max(c.g, c.b));
        c.a = 1.0 - min(max(br * 20.0, 0.0), 0.8);
        gl_FragColor = c;
    }
`;

const sunraysShader = `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    uniform sampler2D uTexture;
    uniform float weight;

    #define ITERATIONS 16

    void main () {
        float Density = 0.3;
        float Decay = 0.95;
        float Exposure = 0.7;

        vec2 coord = vUv;
        vec2 dir = vUv - 0.5;

        dir *= 1.0 / float(ITERATIONS) * Density;
        float illuminationDecay = 1.0;

        float color = texture2D(uTexture, vUv).a;

        for (int i = 0; i < ITERATIONS; i++)
        {
            coord -= dir;
            float col = texture2D(uTexture, coord).a;
            color += col * illuminationDecay * weight;
            illuminationDecay *= Decay;
        }

        gl_FragColor = vec4(color * Exposure, 0.0, 0.0, 1.0);
    }
`;

const splatShader = `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    uniform sampler2D uTarget;
    uniform float aspectRatio;
    uniform vec3 color;
    uniform vec2 point;
    uniform float radius;

    void main () {
        vec2 p = vUv - point.xy;
        p.x *= aspectRatio;
        vec3 splat = exp(-dot(p, p) / radius) * color;
        vec3 base = texture2D(uTarget, vUv).xyz;
        gl_FragColor = vec4(base + splat, 1.0);
    }
`;

const advectionShader = `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform vec2 texelSize;
    uniform vec2 dyeTexelSize;
    uniform float dt;
    uniform float dissipation;

    vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
        vec2 st = uv / tsize - 0.5;

        vec2 iuv = floor(st);
        vec2 fuv = fract(st);

        vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
        vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
        vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
        vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);

        return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
    }

    void main () {
    #ifdef MANUAL_FILTERING
        vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
        vec4 result = bilerp(uSource, coord, dyeTexelSize);
    #else
        vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
        vec4 result = texture2D(uSource, coord);
    #endif
        float decay = 1.0 + dissipation * dt;
        gl_FragColor = result / decay;
    }`;

const divergenceShader = `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uVelocity;

    void main () {
        float L = texture2D(uVelocity, vL).x;
        float R = texture2D(uVelocity, vR).x;
        float T = texture2D(uVelocity, vT).y;
        float B = texture2D(uVelocity, vB).y;

        vec2 C = texture2D(uVelocity, vUv).xy;
        if (vL.x < 0.0) { L = -C.x; }
        if (vR.x > 1.0) { R = -C.x; }
        if (vT.y > 1.0) { T = -C.y; }
        if (vB.y < 0.0) { B = -C.y; }

        float div = 0.5 * (R - L + T - B);
        gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
    }
`;

const curlShader = `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uVelocity;

    void main () {
        float L = texture2D(uVelocity, vL).y;
        float R = texture2D(uVelocity, vR).y;
        float T = texture2D(uVelocity, vT).x;
        float B = texture2D(uVelocity, vB).x;
        float vorticity = R - L - T + B;
        gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
    }
`;

const vorticityShader = `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uVelocity;
    uniform sampler2D uCurl;
    uniform float curl;
    uniform float dt;

    void main () {
        float L = texture2D(uCurl, vL).x;
        float R = texture2D(uCurl, vR).x;
        float T = texture2D(uCurl, vT).x;
        float B = texture2D(uCurl, vB).x;
        float C = texture2D(uCurl, vUv).x;

        vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
        force /= length(force) + 0.0001;
        force *= curl * C;
        force.y *= -1.0;

        vec2 velocity = texture2D(uVelocity, vUv).xy;
        velocity += force * dt;
        velocity = min(max(velocity, -1000.0), 1000.0);
        gl_FragColor = vec4(velocity, 0.0, 1.0);
    }
`;

const pressureShader = `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uDivergence;

    void main () {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        float C = texture2D(uPressure, vUv).x;
        float divergence = texture2D(uDivergence, vUv).x;
        float pressure = (L + R + B + T - divergence) * 0.25;
        gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
    }
`;

const gradientSubtractShader = `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uVelocity;

    void main () {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        vec2 velocity = texture2D(uVelocity, vUv).xy;
        velocity.xy -= vec2(R - L, T - B);
        gl_FragColor = vec4(velocity, 0.0, 1.0);
    }
`;
