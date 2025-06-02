/**
 * Section Manager component for the Van Builder
 * Handles the toggling of different sections of the van model
 */
class SectionManager {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.sections = {}; // Store references to sections
        this.sectionButtons = {}; // Store references to buttons
        
        // Define the specific sections we want to toggle
        this.sectionNames = ['door-rear', 'door-cargo', 'panel-right', 'panel-left'];
    }
    
    /**
     * Initialize section controls after a van model is loaded
     * @param {Object3D} vanModel - The loaded van model
     */
    initSections(vanModel) {
        // Clear existing sections
        this.sections = {};
        
        // Traverse the model to find the specific sections
        vanModel.traverse((child) => {
            // Check if this object's name matches one of our section names
            if (child.name && this.sectionNames.includes(child.name)) {
                this.sections[child.name] = child;
                console.log(`Found section: ${child.name}`);
            }
        });
        
        // If we didn't find all sections by exact name, try partial matches
        if (Object.keys(this.sections).length < this.sectionNames.length) {
            vanModel.traverse((child) => {
                // For sections we haven't found yet, try partial name matches
                this.sectionNames.forEach(sectionName => {
                    if (!this.sections[sectionName] && 
                        child.name && 
                        child.name.toLowerCase().includes(sectionName.toLowerCase())) {
                        this.sections[sectionName] = child;
                        console.log(`Found section by partial match: ${child.name} as ${sectionName}`);
                    }
                });
            });
        }
        
        // Create section toggle UI
        this.createSectionToggles();
    }
    
    /**
     * Create UI buttons for toggling sections
     */
    createSectionToggles() {
        // Clear any existing buttons
        $('#section-toggles-container').empty();
        
        // Create container if it doesn't exist
        if ($('#section-toggles-container').length === 0) {
            const container = $('<div id="section-toggles-container" class="van-builder-section-toggles"></div>');
            $('.van-builder-container').append(container);
        }
        
        // Create buttons for each section
        Object.keys(this.sections).forEach(sectionName => {
            const buttonId = `toggle-${sectionName}`;
            const button = $(`
                <button id="${buttonId}" class="van-builder-section-toggle active">
                    ${this.formatSectionName(sectionName)}
                </button>
            `);
            
            $('#section-toggles-container').append(button);
            this.sectionButtons[sectionName] = button;
            
            // Add click handler
            button.on('click', () => {
                this.toggleSection(sectionName);
            });
        });
        
        // Add "Show All" / "Hide All" buttons if we have sections
        if (Object.keys(this.sections).length > 0) {
            const showAllBtn = $(`
                <button id="show-all-sections" class="van-builder-section-toggle-all">
                    Show All
                </button>
            `);
            
            const hideAllBtn = $(`
                <button id="hide-all-sections" class="van-builder-section-toggle-all">
                    Hide All
                </button>
            `);
            
            $('#section-toggles-container').append(showAllBtn);
            $('#section-toggles-container').append(hideAllBtn);
            
            showAllBtn.on('click', () => this.showAllSections());
            hideAllBtn.on('click', () => this.hideAllSections());
        }
    }
    
    /**
     * Format section name for display
     * @param {string} name - Section name from model
     * @returns {string} - Formatted name for UI
     */
    formatSectionName(name) {
        // Format the section name for display (e.g., 'door-rear' → 'Door Rear')
        return name.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
    
    /**
     * Toggle the visibility of a section
     * @param {string} sectionName - Name of the section to toggle
     */
    toggleSection(sectionName) {
        const section = this.sections[sectionName];
        if (section) {
            section.visible = !section.visible;
            
            // Update button state
            this.sectionButtons[sectionName].toggleClass('active', section.visible);
        }
    }
    
    /**
     * Show all sections
     */
    showAllSections() {
        Object.keys(this.sections).forEach(sectionName => {
            this.sections[sectionName].visible = true;
            this.sectionButtons[sectionName].addClass('active');
        });
    }
    
    /**
     * Hide all sections
     */
    hideAllSections() {
        Object.keys(this.sections).forEach(sectionName => {
            this.sections[sectionName].visible = false;
            this.sectionButtons[sectionName].removeClass('active');
        });
    }
}