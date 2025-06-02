/**
 * Main Van Builder JavaScript file
 */
(function($) {
    'use strict';
    
    // Main Van Builder class
    class VanBuilder {
        constructor() {
            this.sceneManager = null;
            this.modelLoader = null;
            this.interactionManager = null;
            this.uiControls = null;
            this.history = [];
            this.historyIndex = -1;
            this.maxHistorySteps = 20;
            this.selectedObject = null;
            this.isSceneInitialized = false;
            
            // Check if the frontpage is shown
            this.frontpageEnabled = $('#van-builder-scene-container').hasClass('van-builder-container-hidden');
            
            if (this.frontpageEnabled) {
                // Initialize frontpage event handlers first
                this.initFrontpageHandlers();
            } else {
                // Directly initialize the 3D scene
                this.init();
            }
        }
        
        /**
         * Initialize frontpage event handlers
         */
       initFrontpageHandlers() {
    console.log('Setting up frontpage handlers');
    
    // Panel navigation dots
    $('.panel-dot').on('click', function() {
        const panelIndex = $(this).data('panel');
        $('.panel-dot').removeClass('active');
        $(this).addClass('active');
        $('.van-builder-panels-container').css('transform', `translateX(-${panelIndex * 100}%)`);
    });
    
    // Open the designs browse modal
    $('.van-browse-designs-btn').on('click', function() {
        // Copy saved designs to modal
        const designsList = $('.van-builder-all-designs-list').html();
        $('.van-builder-all-designs-container').html(designsList);
        
        // Show modal
        $('#all-designs-modal').css('display', 'block');
    });
    
    // Close modal
    $('.van-builder-modal-close').on('click', function() {
        $('#all-designs-modal').css('display', 'none');
    });
    
    // Close modal when clicking outside
    $(window).on('click', function(e) {
        if ($(e.target).is('#all-designs-modal')) {
            $('#all-designs-modal').css('display', 'none');
        }
    });
    
    // Start new design with selected van model
    $('.van-builder-start-button').on('click', (e) => {
        e.preventDefault();
        const modelId = $(e.currentTarget).data('model-id');
        this.showScene();
        
        // Initialize the scene if not already done
        if (!this.isSceneInitialized) {
            this.init();
            this.isSceneInitialized = true;
        }
        
        // Load the selected van model
        this.loadVanModel(modelId);
    });
    
    // Continue with saved design
    $('.van-builder-continue-button').on('click', (e) => {
        e.preventDefault();
        const designId = $(e.currentTarget).data('design-id');
        this.showScene();
        
        // Initialize the scene if not already done
        if (!this.isSceneInitialized) {
            this.init();
            this.isSceneInitialized = true;
        }
        
        // Load the saved design
        this.loadDesign(designId);
    });
    
    // Delete design button in modal
    $(document).on('click', '.delete-design-button', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const designId = $(this).data('design-id');
        if (window.vanBuilder) {
            window.vanBuilder.deleteDesign(designId);
            
            // Remove from modal list
            $(this).closest('.van-builder-saved-design-item').remove();
            
            // If no more designs, update the main panel
            if ($('.van-builder-all-designs-container .van-builder-saved-design-item').length === 0) {
                const noDesignsHtml = `
                    <div class="van-builder-no-designs">
                        <div class="no-designs-icon">
                            <span class="dashicons dashicons-clipboard"></span>
                        </div>
                        <p>You don't have any saved designs yet.</p>
                        <p>Choose a van model to start designing!</p>
                    </div>`;
                $('.van-builder-design-preview').html(noDesignsHtml);
                $('#all-designs-modal').css('display', 'none');
            }
        }
    });
}
        
        /**
         * Show the 3D scene and hide the frontpage
         */
        showScene() {
    console.log('Showing 3D scene, hiding frontpage');
    
    // Hide the frontpage (both old and new variants)
    $('.van-builder-frontpage, .van-builder-frontpage-modern').hide();
    
    // Show the scene container with proper sizing
    $('#van-builder-scene-container').removeClass('van-builder-container-hidden').show();
    
    // Get the width/height from the wrapper
    const wrapperWidth = $('.van-builder-container-wrapper').width();
    const wrapperHeight = $('.van-builder-app-container').height() || 600;
    
    // Apply dimensions to ensure it takes the same space as the frontpage
    $('#van-builder-scene-container').css({
        'width': wrapperWidth + 'px',
        'height': wrapperHeight + 'px'
    });
    
    // Add "Return to Frontpage" button to the toolbar if it doesn't exist
    if ($('.van-builder-toolbar').length && !$('#van-builder-return-frontpage').length) {
        const returnButton = $(`
            <div class="van-builder-toolbar-section">
                <button id="van-builder-return-frontpage" class="van-builder-button van-builder-return-frontpage" title="Return to Start Page">
                    <span class="dashicons dashicons-arrow-left-alt"></span> Back to Start
                </button>
            </div>
        `);
        
        $('.van-builder-toolbar').prepend(returnButton);
        
        // Add event handler for the return button
        $('#van-builder-return-frontpage').on('click', () => this.returnToFrontpage());
    }
    
    // Force a resize to ensure canvas renders correctly
    setTimeout(() => {
        $(window).trigger('resize');
    }, 100);
}
        
        /**
         * Return to the frontpage
         */
        returnToFrontpage() {
    if (confirm('Return to the start page? Your current design will be preserved if you save it first.')) {
        // Hide the scene container
        $('#van-builder-scene-container').addClass('van-builder-container-hidden').hide();
        
        // Show the frontpage (check which one exists and show it)
        if ($('.van-builder-frontpage-modern').length) {
            $('.van-builder-frontpage-modern').show();
        } else {
            $('.van-builder-frontpage').show();
        }
    }
}
        
        init() {
            // Initialize components
            this.sceneManager = new SceneManager('van-3d-canvas');
            this.modelLoader = new ModelLoader(this.sceneManager);
            this.interactionManager = new InteractionManager(this.sceneManager);
            this.uiControls = new UIControls(this);
            
            // Only load default van model if not using frontpage
            if (!this.frontpageEnabled) {
                const defaultVan = $('.van-builder-container').data('default-van') || 'sprinter';
                this.loadVanModel(defaultVan);
                
                // Expand all accordions by default when directly loading the 3D scene
                setTimeout(() => {
                    $('.van-builder-accordion-header').each(function() {
                        $(this).addClass('active');
                        $(this).next('.van-builder-accordion-content').show();
                    });
                }, 500);
            } else {
                // For frontpage mode, only open the Furniture accordion initially
                // and keep others closed when entering the 3D scene
                setTimeout(() => {
                    // Find the Furniture accordion header and activate it
                    $('.van-builder-accordion-header:contains("Furniture")').addClass('active');
                    $('.van-builder-accordion-header:contains("Furniture")').next('.van-builder-accordion-content').show();
                }, 500);
            }
            
            // Populate model selectors
            this.populateModelSelectors();
            
            // Set up event listeners
            this.setupEventListeners();
        }
        
        loadVanModel(modelId) {
            const vanModels = vanBuilderData.availableModels.vans;
            const modelData = vanModels.find(model => model.id === modelId);

            if (modelData) {
                this.sceneManager.clearScene(true);

                this.modelLoader.loadModel(modelData.file, (model) => {
                    model.userData.isVan = true;
                    model.userData.modelId = modelId;
                    model.userData.modelData = modelData;

                    // Calculate bounding box
                    const box = new THREE.Box3().setFromObject(model);
                    
                    // Position the van so its bottom is exactly at y=0
                    model.position.y = Math.abs(box.min.y); // This ensures the bottom is exactly at y=0
                    
                    this.sceneManager.addToScene(model);
                    this.sceneManager.focusOnObject(model);
                    this.addToHistory();
                });
            }
        }
        
        populateModelSelectors() {
            // We don't need to populate van models in the sidebar anymore,
            // as they are now only on the frontpage
            
            // Populate furniture models
            const furnitureModelsContainer = $('#furniture-models-container');
            furnitureModelsContainer.empty();
            
            vanBuilderData.availableModels.furniture.forEach(model => {
                const modelElement = $(`
                    <div class="van-builder-model-item" data-model-id="${model.id}" data-category="${model.category}">
                        <img src="${model.thumbnail}" alt="${model.name}">
                        <span>${model.name}</span>
                    </div>
                `);
                
                furnitureModelsContainer.append(modelElement);
            });
            
            // Populate materials
            const materialsContainer = $('#materials-container');
            materialsContainer.empty();

            vanBuilderData.availableModels.materials.forEach(material => {
                const materialElement = $(`
                    <div class="van-builder-material-item" data-material-id="${material.id}">
                        <img src="${material.thumbnail}" alt="${material.name}">
                        <span>${material.name}</span>
                    </div>
                `);

                materialsContainer.append(materialElement);
                        
                // Also add to the material dropdown
                $('#object-material').append(`<option value="${material.id}">${material.name}</option>`);
            });
        }
        
        setupEventListeners() {
            const self = this;
            
            // Add to your setupEventListeners method
            $('#van-builder-toggle-drag').on('click', () => {
                this.sceneManager.dragControlsManager.toggle();
                $('#van-builder-toggle-drag').toggleClass('active');
            });

            // Furniture model selection
            $('#furniture-models-container').on('click', '.van-builder-model-item', function() {
                const modelId = $(this).data('model-id');
                self.addFurnitureItem(modelId);
            });
            
            // Material selection
            $('#materials-container').on('click', '.van-builder-material-item', function() {
                const materialId = $(this).data('material-id');
                if (self.selectedObject) {
                    self.applyMaterial(self.selectedObject, materialId);
                }
            });
            
            // Category filter
            $('#furniture-category-filter').on('change', function() {
                const category = $(this).val();
                
                if (category === 'all') {
                    $('.van-builder-model-item').show();
                } else {
                    $('.van-builder-model-item').hide();
                    $(`.van-builder-model-item[data-category="${category}"]`).show();
                }
            });
            
            // Object selection
            this.sceneManager.onObjectSelected = (object) => {
                this.selectedObject = object;
                this.uiControls.updateObjectProperties(object);
            };
            
            // Object deselection
            this.sceneManager.onObjectDeselected = () => {
                this.selectedObject = null;
                this.uiControls.clearObjectProperties();
            };
            
            // Object transformed
            this.interactionManager.onObjectTransformed = () => {
                this.addToHistory();
                if (this.selectedObject) {
                    this.uiControls.updateObjectProperties(this.selectedObject);
                }
            };
            
            // Toolbar buttons
            $('#van-builder-undo').on('click', () => this.undo());
            $('#van-builder-redo').on('click', () => this.redo());
            $('#van-builder-reset-view').on('click', () => this.sceneManager.resetCamera());
            $('#van-builder-toggle-grid').on('click', () => this.sceneManager.toggleGrid());
            $('#van-builder-toggle-measurements').on('click', () => this.sceneManager.toggleMeasurements());
            $('#van-builder-save').on('click', () => this.uiControls.openSaveModal());
            $('#van-builder-load').on('click', () => this.uiControls.openLoadModal());
            $('#van-builder-screenshot').on('click', () => this.takeScreenshot());
            $('#van-builder-fullscreen').on('click', () => this.toggleFullscreen());
            
            // Object property controls
            $('#position-x, #position-y, #position-z').on('change', () => {
                if (this.selectedObject) {
                    const x = parseFloat($('#position-x').val());
                    const y = parseFloat($('#position-y').val());
                    const z = parseFloat($('#position-z').val());
                    
                    this.selectedObject.position.set(x, y, z);
                    this.addToHistory();
                }
            });
            
            $('#rotation-x, #rotation-y, #rotation-z').on('input', function() {
                if (self.selectedObject) {
                    const axis = this.id.split('-')[1];
                    const value = parseFloat(this.value) * Math.PI / 180;
                    
                    if (axis === 'x') self.selectedObject.rotation.x = value;
                    if (axis === 'y') self.selectedObject.rotation.y = value;
                    if (axis === 'z') self.selectedObject.rotation.z = value;
                    
                    $(this).next('.property-value').text(this.value + '°');
                }
            });

            
            $('#rotation-x, #rotation-y, #rotation-z').on('change', () => {
                this.addToHistory();
            });
            
            $('#scale-uniform').on('change', function() {
                $('.scale-non-uniform').toggle(!this.checked);
            });
            
            $('#scale-x, #scale-y, #scale-z').on('change', () => {
                if (this.selectedObject) {
                    const uniform = $('#scale-uniform').is(':checked');
                    const x = parseFloat($('#scale-x').val());
                    
                    if (uniform) {
                        this.selectedObject.scale.set(x, x, x);
                        $('#scale-y').val(x);
                        $('#scale-z').val(x);
                    } else {
                        const y = parseFloat($('#scale-y').val());
                        const z = parseFloat($('#scale-z').val());
                        this.selectedObject.scale.set(x, y, z);
                    }
                    
                    this.addToHistory();
                }
            });
            
            $('#object-color').on('change', function() {
                if (self.selectedObject) {
                    const color = $(this).val();
                    self.applyColor(self.selectedObject, color);
                    self.addToHistory();
                }
            });
            
            $('#object-material').on('change', function() {
                if (self.selectedObject) {
                    const materialId = $(this).val();
                    if (materialId !== 'none') {
                        self.applyMaterial(self.selectedObject, materialId);
                    } else {
                        self.removeMaterial(self.selectedObject);
                    }
                    self.addToHistory();
                }
            });
            
            $('#duplicate-object').on('click', () => {
                if (this.selectedObject && !this.selectedObject.userData.isVan) {
                    this.duplicateObject(this.selectedObject);
                }
            });
            
            $('#remove-object').on('click', () => {
                if (this.selectedObject && !this.selectedObject.userData.isVan) {
                    this.removeObject(this.selectedObject);
                }
            });
            
            // Fix Accordion functionality
            $('.van-builder-accordion-header').on('click', function(e) {
                // Stop the event from propagating further
                e.stopPropagation();
                
                // Toggle active class
                $(this).toggleClass('active');
                
                // Get the next content element
                const content = $(this).next('.van-builder-accordion-content');
                
                // Toggle the content with animation
                content.slideToggle(200);
                
                // Return false to prevent default behavior
                return false;
            });
            
            // Modal close buttons
            $('.van-builder-modal-close').on('click', function() {
                $(this).closest('.van-builder-modal').hide();
            });
            
            // Save design form submission
            $('#save-design-form').on('submit', function(e) {
                e.preventDefault();
                self.saveDesign();
            });
            
            // Load design button
            $('.saved-designs-list').on('click', '.load-design-button', function() {
                const designId = $(this).closest('.saved-design-item').data('design-id');
                self.loadDesign(designId);
            });
            
            // Delete design button
            $('.saved-designs-list').on('click', '.delete-design-button', function() {
                const designId = $(this).closest('.saved-design-item').data('design-id');
                self.deleteDesign(designId);
            });
            
            // Window resize
            $(window).on('resize', () => {
                this.sceneManager.onWindowResize();
            });
        }
        
        addFurnitureItem(modelId) {
            // Find the model data
            const furnitureModels = vanBuilderData.availableModels.furniture;
            const modelData = furnitureModels.find(model => model.id === modelId);
            
            if (modelData) {
                this.modelLoader.loadModel(modelData.file, (model) => {
                    model.userData.isFurniture = true;
                    model.userData.modelId = modelId;
                    model.userData.modelData = modelData;
                    
                    // Position the model in front of the camera
                    const position = this.sceneManager.getPositionInFrontOfCamera(2);
                    model.position.copy(position);
                    
                    // Add to scene
                    this.sceneManager.addToScene(model);
                    
                    // Select the new object
                    this.sceneManager.selectObject(model);
                    
                    // Add to history
                    this.addToHistory();
                  
                    console.log("Loaded Model:", model);
                });
            }
        }
        
        applyMaterial(object, materialId) {
            const materials = vanBuilderData.availableModels.materials;
            const materialData = materials.find(material => material.id === materialId);
            
            if (materialData && object) {
                this.modelLoader.loadTexture(materialData.texture, (texture) => {
                    object.traverse((child) => {
                        if (child.isMesh) {
                            const material = new THREE.MeshStandardMaterial({
                                map: texture,
                                color: 0xffffff
                            });
                            child.material = material;
                            
                            // Store material info in userData
                            child.userData.materialId = materialId;
                        }
                    });
                    
                    // Update UI
                    $('#object-material').val(materialId);
                    
                    // Add to history
                    this.addToHistory();
                });
            }
        }
        
        removeMaterial(object) {
            if (object) {
                object.traverse((child) => {
                    if (child.isMesh) {
                        const color = $('#object-color').val();
                        const material = new THREE.MeshStandardMaterial({
                            color: new THREE.Color(color)
                        });
                        child.material = material;
                        
                        // Remove material info from userData
                        delete child.userData.materialId;
                    }
                });
                
                // Add to history
                this.addToHistory();
            }
        }
        
        applyColor(object, color) {
            if (object) {
                object.traverse((child) => {
                    if (child.isMesh && child.material) {
                        child.material.color.set(color);
                    }
                });
            }
        }
        
        duplicateObject(object) {
            if (!object || object.userData.isVan) return;
            
            // Clone the object
            const clone = object.clone();
            
            // Offset position slightly
            clone.position.x += 0.2;
            clone.position.z += 0.2;
            
            // Add to scene
            this.sceneManager.addToScene(clone);
            
            // Select the new object
            this.sceneManager.selectObject(clone);
            
            // Add to history
            this.addToHistory();
        }
        
        removeObject(object) {
            if (!object || object.userData.isVan) return;
            
            // Remove from scene
            this.sceneManager.removeFromScene(object);
            
            // Deselect
            this.sceneManager.deselectObject();
            
            // Add to history
            this.addToHistory();
        }
        
        addToHistory() {
            // Serialize the current scene state
            const sceneState = this.serializeScene();
            
            // If we're not at the end of the history array, truncate it
            if (this.historyIndex < this.history.length - 1) {
                this.history = this.history.slice(0, this.historyIndex + 1);
            }
            
            // Add the new state to history
            this.history.push(sceneState);
            this.historyIndex = this.history.length - 1;
            
            // Limit history size
            if (this.history.length > this.maxHistorySteps) {
                this.history.shift();
                this.historyIndex--;
            }
            
            // Update UI
            this.updateUndoRedoButtons();
        }
        
        undo() {
            if (this.historyIndex > 0) {
                this.historyIndex--;
                const sceneState = this.history[this.historyIndex];
                this.deserializeScene(sceneState);
                this.updateUndoRedoButtons();
            }
        }
        
        redo() {
            if (this.historyIndex < this.history.length - 1) {
                this.historyIndex++;
                const sceneState = this.history[this.historyIndex];
                this.deserializeScene(sceneState);
                this.updateUndoRedoButtons();
            }
        }
        
        updateUndoRedoButtons() {
            $('#van-builder-undo').prop('disabled', this.historyIndex <= 0);
            $('#van-builder-redo').prop('disabled', this.historyIndex >= this.history.length - 1);
        }
        
        serializeScene() {
            const objects = [];
            
            this.sceneManager.scene.traverse((object) => {
                if (object.userData.isVan || object.userData.isFurniture) {
                    const objectData = {
                        id: object.id,
                        type: object.userData.isVan ? 'van' : 'furniture',
                        modelId: object.userData.modelId,
                        position: {
                            x: object.position.x,
                            y: object.position.y,
                            z: object.position.z
                        },
                        rotation: {
                            x: object.rotation.x,
                            y: object.rotation.y,
                            z: object.rotation.z
                        },
                        scale: {
                            x: object.scale.x,
                            y: object.scale.y,
                            z: object.scale.z
                        }
                    };
                    
                    // Store material info if available
                    if (object.children && object.children.length > 0) {
                        const meshes = [];
                        object.traverse((child) => {
                            if (child.isMesh) {
                                const meshData = {
                                    id: child.id
                                };
                                
                                if (child.material) {
                                    meshData.material = {
                                        color: child.material.color ? '#' + child.material.color.getHexString() : '#ffffff'
                                    };
                                    
                                    if (child.userData.materialId) {
                                        meshData.material.materialId = child.userData.materialId;
                                    }
                                }
                                
                                meshes.push(meshData);
                            }
                        });
                        
                        if (meshes.length > 0) {
                            objectData.meshes = meshes;
                        }
                    }
                    
                    objects.push(objectData);
                }
            });
            
            return {
                objects: objects,
                cameraPosition: {
                    x: this.sceneManager.camera.position.x,
                    y: this.sceneManager.camera.position.y,
                    z: this.sceneManager.camera.position.z
                },
                cameraTarget: {
                    x: this.sceneManager.controls.target.x,
                    y: this.sceneManager.controls.target.y,
                    z: this.sceneManager.controls.target.z
                },
                showGrid: this.sceneManager.gridHelper ? this.sceneManager.gridHelper.visible : false,
                showMeasurements: this.sceneManager.measurementHelper ? this.sceneManager.measurementHelper.visible : false
            };
        }
        
        deserializeScene(sceneState) {
            // Clear the scene
            this.sceneManager.clearScene(true);
            
            // Load all objects
            const objectPromises = sceneState.objects.map(objectData => {
                return new Promise((resolve) => {
                    if (objectData.type === 'van') {
                        // Load van model
                        const vanModels = vanBuilderData.availableModels.vans;
                        const modelData = vanModels.find(model => model.id === objectData.modelId);
                        
                        if (modelData) {
                            this.modelLoader.loadModel(modelData.file, (model) => {
                                model.userData.isVan = true;
                                model.userData.modelId = objectData.modelId;
                                model.userData.modelData = modelData;
                                
                                // Apply transform
                                model.position.set(objectData.position.x, objectData.position.y, objectData.position.z);
                                model.rotation.set(objectData.rotation.x, objectData.rotation.y, objectData.rotation.z);
                                model.scale.set(objectData.scale.x, objectData.scale.y, objectData.scale.z);
                                
                                // Apply materials if defined
                                if (objectData.meshes) {
                                    this.applyMeshMaterials(model, objectData.meshes);
                                }
                                
                                // Add to scene
                                this.sceneManager.addToScene(model);
                                resolve();
                            });
                        } else {
                            resolve();
                        }
                    } else if (objectData.type === 'furniture') {
                        // Load furniture model
                        const furnitureModels = vanBuilderData.availableModels.furniture;
                        const modelData = furnitureModels.find(model => model.id === objectData.modelId);
                        
                        if (modelData) {
                            this.modelLoader.loadModel(modelData.file, (model) => {
                                model.userData.isFurniture = true;
                                model.userData.modelId = objectData.modelId;
                                model.userData.modelData = modelData;
                                
                                // Apply transform
                                model.position.set(objectData.position.x, objectData.position.y, objectData.position.z);
                                model.rotation.set(objectData.rotation.x, objectData.rotation.y, objectData.rotation.z);
                                model.scale.set(objectData.scale.x, objectData.scale.y, objectData.scale.z);
                                
                                // Apply materials if defined
                                if (objectData.meshes) {
                                    this.applyMeshMaterials(model, objectData.meshes);
                                }
                                
                                // Add to scene
                                this.sceneManager.addToScene(model);
                                resolve();
                            });
                        } else {
                            resolve();
                        }
                    } else {
                        resolve();
                    }
                });
            });
            
            // When all objects are loaded, restore camera and other settings
            Promise.all(objectPromises).then(() => {
                // Restore camera position
                this.sceneManager.camera.position.set(
                    sceneState.cameraPosition.x,
                    sceneState.cameraPosition.y,
                    sceneState.cameraPosition.z
                );
                
                // Restore camera target
                this.sceneManager.controls.target.set(
                    sceneState.cameraTarget.x,
                    sceneState.cameraTarget.y,
                    sceneState.cameraTarget.z
                );
                
                this.sceneManager.controls.update();
                
                // Restore grid visibility
                if (this.sceneManager.gridHelper) {
                    this.sceneManager.gridHelper.visible = sceneState.showGrid;
                }
                
                // Restore measurements visibility
                if (this.sceneManager.measurementHelper) {
                    this.sceneManager.measurementHelper.visible = sceneState.showMeasurements;
                }
                
                // Deselect any objects
                this.sceneManager.deselectObject();
            });
        }
        
        applyMeshMaterials(model, meshesData) {
            model.traverse((child) => {
                if (child.isMesh) {
                    const meshData = meshesData.find(data => data.id === child.id);
                    
                    if (meshData && meshData.material) {
                        // Apply color
                        if (meshData.material.color) {
                            child.material.color.set(meshData.material.color);
                        }
                        
                        // Apply texture if meshData.materialId is defined
                        if (meshData.material.materialId) {
                            child.userData.materialId = meshData.material.materialId;
                            
                            const materials = vanBuilderData.availableModels.materials;
                            const materialData = materials.find(material => material.id === meshData.material.materialId);
                            
                            if (materialData) {
                                this.modelLoader.loadTexture(materialData.texture, (texture) => {
                                    child.material.map = texture;
                                    child.material.needsUpdate = true;
                                });
                            }
                        }
                    }
                }
            });
        }
        
        saveDesign() {
            const designName = $('#design-name').val();
            const designId = $('#design-id').val();
            
            if (!designName) {
                alert('Please enter a design name');
                return;
            }
            
            // Serialize the scene
            const designData = JSON.stringify(this.serializeScene());
            
            // Send AJAX request
            $.ajax({
                url: vanBuilderData.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'save_van_design',
                    nonce: vanBuilderData.nonce,
                    design_name: designName,
                    design_data: designData,
                    design_id: designId
                },
                success: (response) => {
                    if (response.success) {
                        // Update design ID in case it was a new design
                        $('#design-id').val(response.data.design_id);
                        
                        // Close modal
                        $('#save-design-modal').hide();
                        
                        // Show success message
                        alert('Design saved successfully!');
                    } else {
                        alert('Error: ' + response.data.message);
                    }
                },
                error: () => {
                    alert('An error occurred while saving the design. Please try again.');
                }
            });
        }
        
        loadDesign(designId) {
            // Send AJAX request
            $.ajax({
                url: vanBuilderData.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'load_van_design',
                    nonce: vanBuilderData.nonce,
                    design_id: designId
                },
                success: (response) => {
                    if (response.success) {
                        // Parse the design data
                        const designData = JSON.parse(response.data.design.design_data);
                        
                        // Load the design
                        this.deserializeScene(designData);
                        
                        // Update design ID and name in the save form
                        $('#design-id').val(response.data.design.id);
                        $('#design-name').val(response.data.design.design_name);
                        
                        // Close modal
                        $('#load-design-modal').hide();
                        
                        // Clear history and add current state
                        this.history = [];
                        this.historyIndex = -1;
                        this.addToHistory();
                    } else {
                        alert('Error: ' + response.data.message);
                    }
                },
                error: () => {
                    alert('An error occurred while loading the design. Please try again.');
                }
            });
        }
        
        deleteDesign(designId) {
            if (confirm('Are you sure you want to delete this design? This action cannot be undone.')) {
                // Send AJAX request
                $.ajax({
                    url: vanBuilderData.ajaxUrl,
                    type: 'POST',
                    data: {
                        action: 'delete_van_design',
                        nonce: vanBuilderData.nonce,
                        design_id: designId
                    },
                    success: (response) => {
                        if (response.success) {
                            // Remove from the list
                            $(`.saved-design-item[data-design-id="${designId}"]`).remove();
                            
                            // If no more designs, show message
                            if ($('.saved-design-item').length === 0) {
                                $('.saved-designs-list').html('<p>You don\'t have any saved designs yet.</p>');
                            }
                        } else {
                            alert('Error: ' + response.data.message);
                        }
                    },
                    error: () => {
                        alert('An error occurred while deleting the design. Please try again.');
                    }
                });
            }
        }
        
        takeScreenshot() {
            // Temporarily hide UI elements in the scene
            const uiElements = this.sceneManager.scene.children.filter(child => child.isUI);
            uiElements.forEach(element => {
                element.visible = false;
            });
            
            // Render the scene
            this.sceneManager.renderer.render(this.sceneManager.scene, this.sceneManager.camera);
            
            // Get the canvas data
            const dataURL = this.sceneManager.renderer.domElement.toDataURL('image/png');
            
            // Show UI elements again
            uiElements.forEach(element => {
                element.visible = true;
            });
            
            // Create a download link
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = 'van-design-' + new Date().toISOString().slice(0, 10) + '.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        
        toggleFullscreen() {
            const container = $('.van-builder-container')[0];
            
            if (!document.fullscreenElement) {
                if (container.requestFullscreen) {
                    container.requestFullscreen();
                } else if (container.mozRequestFullScreen) {
                    container.mozRequestFullScreen();
                } else if (container.webkitRequestFullscreen) {
                    container.webkitRequestFullscreen();
                } else if (container.msRequestFullscreen) {
                    container.msRequestFullscreen();
                }
                
                $('#van-builder-fullscreen').html('<span class="dashicons dashicons-exit"></span>');
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
                
                $('#van-builder-fullscreen').html('<span class="dashicons dashicons-fullscreen-alt"></span>');
            }
            
            // Resize the renderer after a short delay to account for transition
            setTimeout(() => {
                this.sceneManager.onWindowResize();
            }, 300);
        }
    }
    
    // Initialize the Van Builder when the document is ready
    $(document).ready(function() {
        window.vanBuilder = new VanBuilder();
    });
    
})(jQuery);