Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    layout: {
        type: 'vbox'
        //align: 'stretch'
    },
    items:[
        {
            xtype: 'component',
            itemId: 'holder',
            autoEl: 'canvas',
            width: 400,
            height: 300,
            margin: '0 0 200 0'
        }
    ],

    launch: function() {
        var endDate = new Date();//Rally.util.DateTime.fromIsoString('2012-06-01T00:00:00Z');
        var startDate = Rally.util.DateTime.add(endDate, 'month', -3);
        var workspaceOID = this.getContext().getWorkspace().ObjectID;
        var projectOID = this.getContext().getProject().ObjectID;

        // TODO make this configurable
        var openStates = ["Submitted", "Open"];

        //TODO remove this and use the standard store when the new Lookback API url format is online
        Ext.define('Rally.data.lookback.SnapshotStoreOldUrl', {
            extend: 'Rally.data.lookback.SnapshotStore',

            constructor: function(config) {
                this.callParent([config]);
                // temporary override needed since new URL format not deployed yet
                this.proxy.url = Rally.environment.getServer().getLookbackUrl(1.37) + '/' +
                        Rally.util.Ref.getOidFromRef(this.context.workspace) + '/artifact/snapshot/query';
            }
        });


        var snapshotStore = Ext.create('Rally.data.lookback.SnapshotStoreOldUrl', {
                autoLoad: true,
                context: {
                    workspace: ('/workspace/'+ workspaceOID),
                    project: ('/project/'+ projectOID)
                },
                sorters: [
                    {
                        property: 'ObjectID',
                        direction: 'ASC'
                    },
                    {
                        property: '_ValidFrom',
                        direction: 'ASC'
                    }
                ],
                hydrate: ['Priority'],
                fetch: ['ObjectID', 'Priority'],

                // look for snapshots of defects that changed State
                filters: [
                    { property: '_Type', value: 'Defect' },
                    { property: 'State', operator: 'in', value: openStates },
                    { property: '_PreviousValues.State', operator: 'exists', value: true }
                ],
                //limit: Infinity,

                listeners: {
                    load: this.onStoreLoad,
                    scope: this
                }
        });       
    },

    onStoreLoad: function(store, records){
        // var holder = this.down('#holder');
        // holder.add({
        //     xype: 'label',
        //     html: 'Got '+ records.length +' records'
        // });

        // set the scene size
        var WIDTH = 400,
            HEIGHT = 300;

        // set some camera attributes
        var VIEW_ANGLE = 45,
            ASPECT = WIDTH / HEIGHT,
            NEAR = 0.1,
            FAR = 10000;

        // get the DOM element to attach to
        var holder = this.down('#holder').getEl().dom;

        // create a WebGL renderer, camera
        // and a scene
        var renderer = new THREE.WebGLRenderer({
            canvas: holder
        });
        var camera = new THREE.PerspectiveCamera(  VIEW_ANGLE,
                                        ASPECT,
                                        NEAR,
                                        FAR  );
        var scene = new THREE.Scene();

        // the camera starts at 0,0,0 so pull it back
        camera.position.z = 300;

        // start the renderer
        renderer.setSize(WIDTH, HEIGHT);

        // attach the render-supplied DOM element
        //holder.appendChild(renderer.domElement);

        // create the sphere's material
        var sphereMaterial = new THREE.MeshLambertMaterial(
        {
            color: 0xCC0000
        });

        // set up the sphere vars
        var radius = 50, segments = 16, rings = 16;

        // create a new mesh with sphere geometry -
        // we will cover the sphereMaterial next!
        var sphere = new THREE.Mesh(
           new THREE.SphereGeometry(radius, segments, rings),
           sphereMaterial);

        // add the sphere to the scene
        scene.add(sphere);

        // and the camera
        scene.add(camera);

        // create a point light
        var pointLight = new THREE.PointLight( 0xFFFFFF );

        // set its position
        pointLight.position.x = 10;
        pointLight.position.y = 50;
        pointLight.position.z = 130;

        // add to the scene
        scene.add(pointLight);

        // draw!
        renderer.render(scene, camera);
    }
});