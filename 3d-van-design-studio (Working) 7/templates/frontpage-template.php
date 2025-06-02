<?php
// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Get settings from same source as van-builder-template.php
$options = get_option('van_builder_general_settings', array());
$width = isset($atts['width']) ? $atts['width'] : (isset($options['canvas_width']) ? $options['canvas_width'] : '100%');
$height = isset($atts['height']) ? $atts['height'] : (isset($options['canvas_height']) ? $options['canvas_height'] : '600px');
$default_van = isset($atts['default_van']) ? $atts['default_van'] : (isset($options['default_van_model']) ? $options['default_van_model'] : 'sprinter');
$show_controls = isset($atts['show_controls']) ? filter_var($atts['show_controls'], FILTER_VALIDATE_BOOLEAN) : true;
$allow_save = isset($atts['allow_save']) ? filter_var($atts['allow_save'], FILTER_VALIDATE_BOOLEAN) : true;

// Check if guests are allowed to use the builder
$allow_guests = isset($options['allow_guest_designs']) ? filter_var($options['allow_guest_designs'], FILTER_VALIDATE_BOOLEAN) : false;
$user_can_access = is_user_logged_in() || $allow_guests;

// Get saved designs for the current user
$saved_designs = array();
if (is_user_logged_in() && $allow_save) {
    global $wpdb;
    $table_name = $wpdb->prefix . 'van_builder_saved_designs';
    $user_id = get_current_user_id();
    
    $saved_designs = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT id, design_name, updated_at FROM $table_name WHERE user_id = %d ORDER BY updated_at DESC",
            $user_id
        ),
        ARRAY_A
    );
}

// Get van models
$available_models = array();
if (class_exists('Van_Builder_Models')) {
    $available_models = Van_Builder_Models::get_available_models();
} else {
    // Fallback models if class doesn't exist
    $available_models = array(
        'vans' => array(
            array(
                'id' => 'sprinter',
                'name' => 'Mercedes Sprinter',
                'subtitle' => 'Sprinter',
                'thumbnail' => VAN_BUILDER_PLUGIN_URL . 'assets/img/sprinter-thumb.jpg'
            ),
            array(
                'id' => 'transit',
                'name' => 'Ford Transit',
                'subtitle' => 'Transit',
                'thumbnail' => VAN_BUILDER_PLUGIN_URL . 'assets/img/transit-thumb.jpg'
            ),
            array(
                'id' => 'promaster',
                'name' => 'Ram ProMaster',
                'subtitle' => 'ProMaster',
                'thumbnail' => VAN_BUILDER_PLUGIN_URL . 'assets/img/promaster-thumb.jpg'
            )
        )
    );
}

$van_models = isset($available_models['vans']) ? $available_models['vans'] : array();
?>

<?php if (!$user_can_access): ?>
    <div class="van-builder-login-required">
        <p>Please <a href="<?php echo esc_url(wp_login_url(get_permalink())); ?>">log in</a> to use the 3D Van Designer.</p>
    </div>
<?php else: ?>

<div class="van-builder-frontpage-modern" style="width: <?php echo esc_attr($width); ?>;">
    <div class="van-builder-app-container">
        <header class="van-builder-app-header">
            <div class="van-builder-app-buttons">
                <span class="app-button red"></span>
                <span class="app-button yellow"></span>
                <span class="app-button green"></span>
            </div>
            <h1 class="van-builder-app-title">Van Designer</h1>
            <div class="van-builder-app-actions">
                <?php if (is_user_logged_in()): ?>
                <span class="van-builder-user-icon">
                    <span class="dashicons dashicons-admin-users"></span>
                    <?php echo esc_html(wp_get_current_user()->display_name); ?>
                </span>
                <?php endif; ?>
                <button class="van-builder-start-now-btn">Build Now</button>
                <span class="van-builder-close-btn">&times;</span>
            </div>
        </header>
        
        <div class="van-builder-app-content">
            <!-- Main heading -->
            <div class="van-builder-main-heading">
                <h2>Choose Your Van</h2>
                <p>Build your dream van and hit the road.</p>
            </div>
            
            <!-- Two-column layout -->
            <div class="van-builder-two-column">
                <!-- Left Column: Van Models -->
                <div class="van-builder-left-column">
                    <div class="van-builder-models-container">
                        <?php foreach ($van_models as $model): ?>
                            <div class="van-builder-model-card" data-model-id="<?php echo esc_attr($model['id']); ?>">
                                <div class="van-builder-model-image">
                                    <!-- Force image to be displayed with explicit dimensions -->
                                    <img 
                                        src="<?php echo esc_url($model['thumbnail']); ?>" 
                                        alt="<?php echo esc_attr($model['name']); ?>"
                                        style="width: 100%; height: auto; max-height: 100%; object-fit: contain;"
                                    >
                                </div>
                                <div class="van-builder-model-info">
                                    <h3><?php echo esc_html($model['name']); ?></h3>
                                    <p><?php echo isset($model['subtitle']) ? esc_html($model['subtitle']) : ''; ?></p>
                                    <button class="van-builder-start-button" data-model-id="<?php echo esc_attr($model['id']); ?>">
                                        Start Customizing
                                    </button>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
                
                <!-- Right Column: Saved Designs -->
                <div class="van-builder-right-column">
                    <h3>Your Saved Designs</h3>
                    
                    <?php if (is_user_logged_in() && $allow_save): ?>
                        <div class="van-builder-saved-designs-container">
                            <?php if (empty($saved_designs)): ?>
                                <div class="van-builder-no-designs">
                                    <div class="no-designs-icon">
                                        <span class="dashicons dashicons-clipboard"></span>
                                    </div>
                                    <p>You don't have any saved designs yet.</p>
                                    <p>Choose a van model to start designing!</p>
                                </div>
                            <?php else: ?>
                                <div class="van-builder-saved-designs-list">
                                    <?php foreach ($saved_designs as $index => $design): ?>
                                        <div class="van-builder-saved-design-item" data-design-id="<?php echo esc_attr($design['id']); ?>">
                                            <div class="van-builder-saved-design-info">
                                                <h4><?php echo esc_html($design['design_name']); ?></h4>
                                                <p>Last modified: <?php echo esc_html(date('F j, Y g:i a', strtotime($design['updated_at']))); ?></p>
                                            </div>
                                            <div class="van-builder-saved-design-actions">
                                                <button class="van-builder-continue-button" data-design-id="<?php echo esc_attr($design['id']); ?>">
                                                    Load Design
                                                </button>
                                                <button class="delete-design-button" data-design-id="<?php echo esc_attr($design['id']); ?>">
                                                    <span class="dashicons dashicons-trash"></span>
                                                </button>
                                            </div>
                                        </div>
                                    <?php endforeach; ?>
                                </div>
                            <?php endif; ?>
                        </div>
                    <?php else: ?>
                        <div class="van-builder-login-notice">
                            <div class="login-notice-icon">
                                <span class="dashicons dashicons-lock"></span>
                            </div>
                            <p>Please log in to save and access your designs.</p>
                            <a href="<?php echo esc_url(wp_login_url(get_permalink())); ?>" class="van-builder-login-button">Log In</a>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>
</div>

<?php endif; // End user_can_access check ?>