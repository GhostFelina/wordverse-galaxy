import { expect, test } from '@playwright/test';
test('gas composition preserves HDR radiance and matches the final ACES display, including the RGBA8 fallback', async ({
  page,
}) => {
  await page.goto('/tests/fixtures/word-star-lab.html');
  await expect(page.locator('#star-lab')).toHaveAttribute('data-ready', 'true');
  const results = await page.evaluate(async () => {
    const THREE = await import('/node_modules/three/build/three.module.js');
    const { createNebulaSystem } = await import('/src/nebula-system.js');
    const results = [];
    for (const fallback of [false, true]) {
      const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
      renderer.setSize(32, 32);
      renderer.setClearColor(0, 1);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.85;
      const originalHas = renderer.extensions.has.bind(renderer.extensions);
      if (fallback) renderer.extensions.has = (name) => (name === 'EXT_color_buffer_float' ? false : originalHas(name));
      const scene = new THREE.Scene(),
        camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100000);
      const system = createNebulaSystem(scene, camera, {
        fieldStars: false,
        loader: {
          load(_url, ready) {
            const texture = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
            texture.needsUpdate = true;
            ready();
            return texture;
          },
        },
      });
      camera.position.fromArray(system.records[0].position);
      camera.updateMatrixWorld();
      system.setQuality('high');
      system.update(0, 1, 32);
      await new Promise((resolve, reject) => {
        const deadline = performance.now() + 15000;
        const frame = () => {
          system.render(renderer);
          if (system.failed) {
            reject(new Error('Gas setup failed'));
            return;
          }
          if (system.ready) {
            resolve();
            return;
          }
          if (performance.now() > deadline) {
            reject(new Error('Gas setup timed out'));
            return;
          }
          requestAnimationFrame(frame);
        };
        frame();
      });
      const gas = scene.getObjectByName('orion-continuous-gas');
      // A known HDR calibration patch traverses the production gas target and
      // compositor; compare it with Three's normal final display transform.
      gas.material.fragmentShader = `uniform float encodedHdr;void main(){gl_FragColor=vec4(2.,.5,.1,1.);if(encodedHdr>.5)gl_FragColor.rgb/=1.+gl_FragColor.rgb;}`;
      gas.material.needsUpdate = true;
      camera.layers.set(1);
      await renderer.compileAsync(scene, camera);
      camera.layers.set(0);
      system.setAppearance({ density: 1, light: 1 });
      renderer.render(scene, camera);
      system.render(renderer);
      const gl = renderer.getContext(),
        actual = new Uint8Array(4);
      gl.readPixels(16, 16, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, actual);
      const referenceScene = new THREE.Scene(),
        referenceCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const geometry = new THREE.PlaneGeometry(2, 2),
        material = new THREE.ShaderMaterial({
          vertexShader: 'void main(){gl_Position=vec4(position.xy,0.,1.);}',
          fragmentShader: `void main(){gl_FragColor=vec4(2.,.5,.1,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`,
        });
      referenceScene.add(new THREE.Mesh(geometry, material));
      renderer.render(referenceScene, referenceCamera);
      const expected = new Uint8Array(4);
      gl.readPixels(16, 16, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, expected);
      results.push({ fallback, actual: [...actual], expected: [...expected] });
      geometry.dispose();
      material.dispose();
      system.dispose();
      renderer.dispose();
    }
    return results;
  });
  for (const result of results) {
    expect(result.actual[0]).toBeLessThan(255);
    for (let i = 0; i < 3; i++)
      expect(Math.abs(result.actual[i] - result.expected[i]), JSON.stringify(result)).toBeLessThanOrEqual(3);
  }
});
