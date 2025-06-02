<?php
/**
 * Admin settings class
 */
class Van_Builder_Admin_Settings {
    
    public function __construct() {
        add_action('admin_menu', array($this, 'add_settings_page'));
        add_action('admin_init', array($this, 'initialize_settings'));
    }
    
    /**
     * Add settings page to admin menu
     */
    public function add_settings_page() {
        add_menu_page(
            '3D Van Designer Settings',
            '3D Van Designer',
            'manage_options',
            'van_builder_settings',
            array($this, 'render_settings_page'),
            'dashicons-editor-kitchensink',
            30
        );
    }
    
    /**
     * Initialize settings fields and sections
     */
    public function initialize_settings() {
        register_setting('van_builder_settings', 'van_builder_general_settings');
        
        add_settings_section(
            'van_builder_general_section',
            'General Settings',
            array($this, 'render_general_section'),
            'van_builder_settings'
        );
        
        add_settings_field(
            'canvas_width',
            'Default Canvas Width',
            array($this, 'render_canvas_width_field'),
            'van_builder_settings',
            'van_builder_general_section'
        );
        
        add_settings_field(
            'canvas_height',
            'Default Canvas Height',
            array($this, 'render_canvas_height_field'),
            'van_builder_settings',
            'van_builder_general_section'
        );
        
        add_settings_field(
            'default_van_model',
            'Default Van Model',
            array($this, 'render_default_van_model_field'),
            'van_builder_settings',
            'van_builder_general_section'
        );
        
        add_settings_field(
            'allow_guest_designs',
            'Allow Guest Users',
            array($this, 'render_allow_guest_designs_field'),
            'van_builder_settings',
            'van_builder_general_section'
        );
        
        // Add new setting for frontpage
        add_settings_field(
            'show_frontpage_default',
            'Show Start Page',
            array($this, 'render_show_frontpage_field'),
            'van_builder_settings',
            'van_builder_general_section'
        );
    }
    
    /**
     * Render the general section description
     */
    public function render_general_section() {
        echo '<p>Configure general settings for the 3D Van Designer.</p>';
    }
    
    /**
     * Render canvas width field
     */
    public function render_canvas_width_field() {
        $options = get_option('van_builder_general_settings');
        $width = isset($options['canvas_width']) ? $options['canvas_width'] : '100%';
        ?>
        <input type="text" name="van_builder_general_settings[canvas_width]" value="<?php echo esc_attr($width); ?>" />
        <p class="description">Enter width in px or % (e.g. 800px or 100%)</p>
        <?php
    }
    
    /**
     * Render canvas height field
     */
    public function render_canvas_height_field() {
        $options = get_option('van_builder_general_settings');
        $height = isset($options['canvas_height']) ? $options['canvas_height'] : '600px';
        ?>
        <input type="text" name="van_builder_general_settings[canvas_height]" value="<?php echo esc_attr($height); ?>" />
        <p class="description">Enter height in px (e.g. 600px)</p>
        <?php
    }
    
    /**
     * Render default van model field
     */
    public function render_default_van_model_field() {
        $options = get_option('van_builder_general_settings');
        $default_model = isset($options['default_van_model']) ? $options['default_van_model'] : 'sprinter';
        $available_models = Van_Builder_Models::get_available_models();
        ?>
        <select name="van_builder_general_settings[default_van_model]">
            <?php foreach ($available_models['vans'] as $model): ?>
                <option value="<?php echo esc_attr($model['id']); ?>" <?php selected($default_model, $model['id']); ?>>
                    <?php echo esc_html($model['name']); ?>
                </option>
            <?php endforeach; ?>
        </select>
        <p class="description">Select the default van model that will be loaded when creating a new design</p>
        <?php
    }
    
    /**
     * Render allow guest designs field
     */
    public function render_allow_guest_designs_field() {
        $options = get_option('van_builder_general_settings');
        $allow_guests = isset($options['allow_guest_designs']) ? $options['allow_guest_designs'] : false;
        ?>
        <input type="checkbox" name="van_builder_general_settings[allow_guest_designs]" value="1" <?php checked(1, $allow_guests); ?> />
        <p class="description">Allow non-logged-in users to use the designer (they won't be able to save designs)</p>
        <?php
    }
    
    /**
     * Render show frontpage field
     */
    public function render_show_frontpage_field() {
        $options = get_option('van_builder_general_settings');
        $show_frontpage = isset($options['show_frontpage_default']) ? $options['show_frontpage_default'] : true;
        ?>
        <input type="checkbox" name="van_builder_general_settings[show_frontpage_default]" value="1" <?php checked(1, $show_frontpage); ?> />
        <p class="description">Show the start page with van selection and saved designs before entering the 3D editor</p>
        <?php
    }
    
    /**
     * Render the settings page
     */
    public function render_settings_page() {
        include VAN_BUILDER_PLUGIN_DIR . 'includes/admin/views/settings-page.php';
    }
}